// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BlobStorageConnectorFactory,
	type IBlobStorage,
	type IBlobStorageConnector
} from "@gtsc/blob-storage-models";
import { GeneralError, Guards, Is, NotFoundError, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import type { IBlobStorageServiceConfig } from "./models/IBlobStorageServiceConfig";

/**
 * Service for performing blob storage operations to a connector.
 */
export class BlobStorageService implements IBlobStorage {
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
	 * @param requestContext The context for the request.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(
		blob: Uint8Array,
		options?: {
			namespace?: string;
		},
		requestContext?: IServiceRequestContext
	): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		try {
			const connectorNamespace = options?.namespace ?? this._defaultNamespace;

			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			return blobStorageConnector.set(blob, requestContext);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "setFailed", undefined, error);
		}
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @param requestContext The context for the request.
	 * @returns The data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(id: string, requestContext?: IServiceRequestContext): Promise<Uint8Array> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();
			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			const blob = await blobStorageConnector.get(id, requestContext);
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
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 */
	public async remove(id: string, requestContext?: IServiceRequestContext): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const idUri = Urn.fromValidString(id);
			const connectorNamespace = idUri.namespaceIdentifier();
			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			const removed = await blobStorageConnector.remove(id, requestContext);

			if (!removed) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}
}
