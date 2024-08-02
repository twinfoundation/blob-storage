// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BlobStorageConnectorFactory,
	type IBlobStorage,
	type IBlobStorageConnector
} from "@gtsc/blob-storage-models";
import { GeneralError, Guards, Is, NotFoundError, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IBlobStorageServiceConfig } from "./models/IBlobStorageServiceConfig";

/**
 * Service for performing blob storage operations to a connector.
 */
export class BlobStorageService implements IBlobStorage {
	/**
	 * The namespace supported by the blob storage service.
	 */
	public static readonly NAMESPACE: string = "blob";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<BlobStorageService>();

	/**
	 * The namespace of the default storage connector to use.
	 * Defaults to the first entry in the factory if not provided.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * Create a new instance of BlobStorageService.
	 * @param config The configuration for the service.
	 */
	constructor(config?: IBlobStorageServiceConfig) {
		const names = BlobStorageConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}
		this._defaultNamespace = config?.defaultNamespace ?? names[0];
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @param options Additional options for the blob.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(
		blob: Uint8Array,
		options?: {
			namespace?: string;
		}
	): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		try {
			const connectorNamespace = options?.namespace ?? this._defaultNamespace;

			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			return blobStorageConnector.set(blob);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "setFailed", undefined, error);
		}
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(id: string): Promise<Uint8Array> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const blobStorageConnector = this.getConnector(id);

			const blob = await blobStorageConnector.get(id);
			if (Is.undefined(blob)) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}

			return blob;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const blobStorageConnector = this.getConnector(id);

			const removed = await blobStorageConnector.remove(id);

			if (!removed) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the blob storage item in urn format.
	 * @returns The connector.
	 * @internal
	 */
	private getConnector(id: string): IBlobStorageConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== BlobStorageService.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: BlobStorageService.NAMESPACE,
				id
			});
		}

		return BlobStorageConnectorFactory.get<IBlobStorageConnector>(idUri.namespaceMethod());
	}
}
