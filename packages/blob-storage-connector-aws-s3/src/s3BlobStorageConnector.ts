// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListBucketsCommand,
	PutObjectCommand,
	S3Client
} from "@aws-sdk/client-s3";
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { BaseError, Converter, GeneralError, Guards, Urn } from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import type { IS3BlobStorageConnectorConfig } from "./models/IS3BlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations on S3.
 * See https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/ for more information.
 */
export class S3BlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "s3";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<S3BlobStorageConnector>();

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IS3BlobStorageConnectorConfig;

	/**
	 * The S3 client.
	 * @internal
	 */
	private readonly _s3Client: S3Client;

	/**
	 * Create a new instance of S3BlobStorageConnector.
	 * @param options The options for the connector.
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: { config: IS3BlobStorageConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IS3BlobStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.region), options.config.region);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.bucketName),
			options.config.bucketName
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.accessKeyId),
			options.config.accessKeyId
		);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.secretAccessKey),
			options.config.secretAccessKey
		);

		this._config = options.config;
		this._s3Client = new S3Client({
			region: this._config.region,
			endpoint: this._config.endpoint,
			credentials: {
				accessKeyId: this._config.accessKeyId,
				secretAccessKey: this._config.secretAccessKey
			},
			forcePathStyle: true
		});
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
				message: "bucketCreating",
				data: {
					bucket: this._config.bucketName
				}
			});

			const listBucketsCommand = new ListBucketsCommand({});
			const bucketsList = await this._s3Client.send(listBucketsCommand);
			const bucketExists = bucketsList.Buckets?.some(
				bucket => bucket.Name === this._config.bucketName
			);

			if (bucketExists) {
				await nodeLogging?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "bucketExists",
					data: {
						bucket: this._config.bucketName
					}
				});
			} else {
				await this._s3Client.send(new CreateBucketCommand({ Bucket: this._config.bucketName }));

				await nodeLogging?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "bucketCreated",
					data: {
						bucket: this._config.bucketName
					}
				});
			}
		} catch (err) {
			await nodeLogging?.log({
				level: "error",
				source: this.CLASS_NAME,
				message: "bucketCreateFailed",
				data: {
					bucket: this._config.bucketName
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

			const command = new PutObjectCommand({
				Bucket: this._config.bucketName,
				Key: id,
				Body: blob
			});

			await this._s3Client.send(command);

			return `blob:${new Urn(S3BlobStorageConnector.NAMESPACE, id).toString()}`;
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

		if (urnParsed.namespaceMethod() !== S3BlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: S3BlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);
			const command = new GetObjectCommand({
				Bucket: this._config.bucketName,
				Key: key
			});

			const response = await this._s3Client.send(command);

			if (response.Body) {
				return new Uint8Array(await response.Body.transformToByteArray());
			}
		} catch {}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== S3BlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: S3BlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);

			const headCommand = new HeadObjectCommand({
				Bucket: this._config.bucketName,
				Key: key
			});

			try {
				await this._s3Client.send(headCommand);
			} catch (error) {
				if (BaseError.isErrorName(error, "NotFound")) {
					return false;
				}
				throw error;
			}

			const deleteCommand = new DeleteObjectCommand({
				Bucket: this._config.bucketName,
				Key: key
			});

			await this._s3Client.send(deleteCommand);

			return true;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "removeBlobFailed", { id }, err);
		}
	}
}
