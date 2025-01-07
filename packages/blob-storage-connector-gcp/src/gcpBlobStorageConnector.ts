// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Storage } from "@google-cloud/storage";
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { BaseError, Converter, GeneralError, Guards, Is, ObjectHelper, Urn } from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { LoggingConnectorFactory } from "@twin.org/logging-models";
import { nameof } from "@twin.org/nameof";
import { MimeTypes } from "@twin.org/web";
import type { JWTInput } from "google-auth-library";
import type { IGcpBlobStorageConnectorConfig } from "./models/IGcpBlobStorageConnectorConfig";
import type { IGcpBlobStorageConnectorConstructorOptions } from "./models/IGcpBlobStorageConnectorConstructorOptions";

/**
 * Class for performing blob storage operations on GCP Storage.
 * See https://cloud.google.com/storage/docs/reference/libraries for more information.
 */
export class GcpBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "gcp";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<GcpBlobStorageConnector>();

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IGcpBlobStorageConnectorConfig;

	/**
	 * The GCP Storage client.
	 * @internal
	 */
	private readonly _storage: Storage;

	/**
	 * Create a new instance of GcpBlobStorageConnector.
	 * @param options The options for the connector.
	 */
	constructor(options: IGcpBlobStorageConnectorConstructorOptions) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IGcpBlobStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.projectId), options.config.projectId);

		let credentials: JWTInput | undefined;
		if (!Is.empty(options.config.credentials)) {
			Guards.stringBase64(
				this.CLASS_NAME,
				nameof(options.config.credentials),
				options.config.credentials
			);
			credentials = ObjectHelper.fromBytes<JWTInput>(
				Converter.base64ToBytes(options.config.credentials)
			);
		}

		Guards.stringValue(
			this.CLASS_NAME,
			nameof(options.config.bucketName),
			options.config.bucketName
		);

		this._config = options.config;
		this._storage = new Storage({
			projectId: this._config.projectId,
			apiEndpoint: this._config.apiEndpoint,
			credentials
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

			const [buckets] = await this._storage.getBuckets();
			const bucketExists = buckets.some(bucket => bucket.name === this._config.bucketName);

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
				await this._storage.createBucket(this._config.bucketName);

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
			const bucket = this._storage.bucket(this._config.bucketName);
			const file = bucket.file(id);

			await file.save(blob, {
				contentType: MimeTypes.OctetStream
			});

			return `blob:${new Urn(GcpBlobStorageConnector.NAMESPACE, id).toString()}`;
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

		if (urnParsed.namespaceMethod() !== GcpBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: GcpBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);
			const bucket = this._storage.bucket(this._config.bucketName);
			const file = bucket.file(key);

			const [exists] = await file.exists();
			if (!exists) {
				return undefined;
			}

			const [contents] = await file.download();
			return new Uint8Array(contents);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "getBlobFailed", { id }, err);
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

		if (urnParsed.namespaceMethod() !== GcpBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: GcpBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const key = urnParsed.namespaceSpecific(1);
			const bucket = this._storage.bucket(this._config.bucketName);
			const file = bucket.file(key);

			const [exists] = await file.exists();
			if (!exists) {
				return false;
			}

			await file.delete();
			return true;
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "removeBlobFailed", { id }, err);
		}
	}
}
