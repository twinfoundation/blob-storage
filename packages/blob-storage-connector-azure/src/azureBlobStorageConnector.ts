// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	type BlockBlobClient,
	BlobServiceClient,
	type ContainerClient,
	type BlobClient,
	type BlobDeleteOptions,
	type BlobDeleteResponse,
	StorageSharedKeyCredential
} from "@azure/storage-blob";
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { BaseError, Converter, GeneralError, Guards, Urn } from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
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
			nameof(options.config.accountName),
			options.config.accountName
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.accountKey),
			options.config.accountKey
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.containerName),
			options.config.containerName
		);

		this._config = options.config;

		this._azureBlobServiceClient = new BlobServiceClient(
			(options.config.endpoint ?? "https://{accountName}.blob.core.windows.net/").replace(
				"{accountName}",
				options.config.accountName
			),
			new StorageSharedKeyCredential(options.config.accountName, options.config.accountKey)
		);

		this._azureContainerClient = this._azureBlobServiceClient.getContainerClient(
			options.config.containerName
		);
	}

	/**
	 * Bootstrap the component by creating and initializing any resources it needs.
	 * @param nodeLoggingConnectorType The node logging connector type, defaults to "node-logging".
	 * @returns True if the bootstrapping process was successful.
	 */
	public async bootstrap(nodeLoggingConnectorType?: string): Promise<boolean> {
		const nodeLogging = LoggingConnectorFactory.getIfExists(
			nodeLoggingConnectorType ?? "node-logging"
		);

		try {
			await nodeLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				message: "containerCreating",
				data: {
					container: this._config.containerName
				}
			});

			const exists = await this._azureContainerClient.exists();

			if (exists) {
				await nodeLogging?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "containerExists",
					data: {
						container: this._config.containerName
					}
				});
			} else {
				await this._azureContainerClient.create();

				await nodeLogging?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "containerCreated",
					data: {
						container: this._config.containerName
					}
				});
			}
		} catch (err) {
			await nodeLogging?.log({
				level: "error",
				source: this.CLASS_NAME,
				message: "containerCreateFailed",
				data: {
					container: this._config.containerName
				},
				error: BaseError.fromError(err)
			});

			return false;
		}

		return true;
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
			await blockBlobClient.uploadData(blob);

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
			const buffer = await blobClient.downloadToBuffer();
			return new Uint8Array(buffer);
		} catch (err) {
			throw new GeneralError(
				this.CLASS_NAME,
				"getBlobFailed",
				{
					id,
					namespace: AzureBlobStorageConnector.NAMESPACE
				},
				err
			);
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
