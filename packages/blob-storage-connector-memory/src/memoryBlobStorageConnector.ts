// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageConnector } from "@gtsc/blob-storage-models";
import { Converter, Guards, Is } from "@gtsc/core";
import { Sha256 } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IMemoryBlobStorageConnectorConfig } from "./models/IMemoryBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations in-memory.
 */
export class MemoryBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<MemoryBlobStorageConnector>();

	/**
	 * The storage for the in-memory items.
	 * @internal
	 */
	private readonly _store: { [tenantId: string]: { [id: string]: Uint8Array } };

	/**
	 * Create a new instance of MemoryBlobStorageConnector.
	 * @param config The configuration for the blob storage connector.
	 */
	constructor(config?: IMemoryBlobStorageConnectorConfig) {
		this._store = config?.initialValues ?? {};
	}

	/**
	 * Set the blob.
	 * @param requestContext The context for the request.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob.
	 */
	public async set(requestContext: IRequestContext, blob: Uint8Array): Promise<string> {
		Guards.object(MemoryBlobStorageConnector._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			MemoryBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.uint8Array(MemoryBlobStorageConnector._CLASS_NAME, nameof(blob), blob);

		const id = Converter.bytesToHex(Sha256.sum256(blob));

		this._store[requestContext.tenantId] ??= {};
		this._store[requestContext.tenantId][id] = blob;

		return id;
	}

	/**
	 * Get the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to get.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(requestContext: IRequestContext, id: string): Promise<Uint8Array | undefined> {
		Guards.object(MemoryBlobStorageConnector._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			MemoryBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(MemoryBlobStorageConnector._CLASS_NAME, nameof(id), id);

		return this._store[requestContext.tenantId]?.[id];
	}

	/**
	 * Remove the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to remove.
	 * @returns Nothing.
	 */
	public async remove(requestContext: IRequestContext, id: string): Promise<void> {
		Guards.object(MemoryBlobStorageConnector._CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(
			MemoryBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.stringValue(MemoryBlobStorageConnector._CLASS_NAME, nameof(id), id);

		if (!Is.undefined(this._store[requestContext.tenantId]?.[id])) {
			delete this._store[requestContext.tenantId]?.[id];
		}
	}

	/**
	 * Get the memory store for the specified tenant.
	 * @param tenantId The tenant id.
	 * @returns The store.
	 */
	public getStore(tenantId: string): { [id: string]: Uint8Array } | undefined {
		return this._store[tenantId];
	}
}
