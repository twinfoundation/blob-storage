// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Readable } from "node:stream";
import {
	type BlockBlobClient,
	BlobServiceClient,
	type ContainerClient,
	type BlobClient,
	type BlobDeleteOptions,
	type BlobDeleteResponse
} from "@azure/storage-blob";
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { Converter, GeneralError, Guards, Urn } from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { nameof } from "@twin.org/nameof";
import type { IAzureBlobStorageConnectorConfig } from "./models/IAzureBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations on Azure.
 * See https://learn.microsoft.com/en-us/azure/storage/common/storage-samples-javascript?toc=%2Fazure%2Fstorage%2Fblobs%2Ftoc.json for more information.
 */
export class AzureBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "azure";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<AzureBlobStorageConnector>();

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IAzureBlobStorageConnectorConfig;

	/**
	 * The Azure Service client.
	 * @internal
	 */
	private readonly _azureBlobServiceClient: BlobServiceClient;

	/**
	 * The Azure Container client.
	 * @internal
	 */
	private readonly _azureContainerClient: ContainerClient;

	/**
	 * Create a new instance of AzureBlobStorageConnector.
	 * @param options The options for the connector.
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: { config: IAzureBlobStorageConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IAzureBlobStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.containerName),
			options.config.containerName
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.connectionString),
			options.config.connectionString
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.blobEndpoint),
			options.config.blobEndpoint
		);

		this._config = options.config;

		const AZURITE_CONNECTION_STRING = options.config.connectionString + options.config.blobEndpoint;

		this._azureBlobServiceClient =
			BlobServiceClient.fromConnectionString(AZURITE_CONNECTION_STRING);

		this._azureContainerClient = this._azureBlobServiceClient.getContainerClient(
			options.config.containerName
		);
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		try {
			const id = Converter.bytesToHex(Sha256.sum256(blob));
			const blockBlobClient: BlockBlobClient = this._azureContainerClient.getBlockBlobClient(id);

			const readableStream = new Readable({
				/**
				 * Reads data from the blob and pushes it into the stream.
				 * This method is automatically called when the stream is read from.
				 * It pushes the blob data and signals the end of the stream.
				 */
				read() {
					this.push(blob);
					this.push(null);
				}
			});
			await blockBlobClient.uploadStream(readableStream);

			return `blob:${new Urn(AzureBlobStorageConnector.NAMESPACE, id).toString()}`;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "setBlobFailed", undefined, err);
		}
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(id: string): Promise<Uint8Array | undefined> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== AzureBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: AzureBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);
			const blobClient: BlobClient = this._azureContainerClient.getBlobClient(key);
			const downloadResponse = await blobClient.download();

			if (!downloadResponse.errorCode && downloadResponse?.readableStreamBody) {
				const readableStream = downloadResponse.readableStreamBody as Readable;

				const chunks: Uint8Array[] = [];
				for await (const chunk of readableStream) {
					chunks.push(chunk);
				}

				const buffer = Buffer.concat(chunks);
				return new Uint8Array(buffer);
			}
			return undefined;
		} catch(err) {
			throw new GeneralError(this.CLASS_NAME, "getBlobFailed", {
				id, namespace: AzureBlobStorageConnector.NAMESPACE
			}, err);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== AzureBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: AzureBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);

			const blockBlobClient: BlockBlobClient =
				await this._azureContainerClient.getBlockBlobClient(key);

			const options: BlobDeleteOptions = {
				deleteSnapshots: "include"
			};
			const blobDeleteResponse: BlobDeleteResponse = await blockBlobClient.delete(options);

			if (!blobDeleteResponse.errorCode) {
				return true;
			}
			return false;
		} catch (err) {
			if (err instanceof Error && "statusCode" in err && err.statusCode === 404) {
				return false;
			}
			throw new GeneralError(this.CLASS_NAME, "removeBlobFailed", { id }, err);
		}
	}
}
