// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageConnector } from "@gtsc/blob-storage-models";
import { Converter, GeneralError, Guards, Urn } from "@gtsc/core";
import { Sha256 } from "@gtsc/crypto";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";

/**
 * Class for performing blob storage operations in-memory.
 */
export class MemoryBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 * @internal
	 */
	public static readonly NAMESPACE: string = "memory";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<MemoryBlobStorageConnector>();

	/**
	 * The storage for the in-memory items.
	 * @internal
	 */
	private readonly _store: { [partitionId: string]: { [id: string]: Uint8Array } };

	/**
	 * Create a new instance of MemoryBlobStorageConnector.
	 */
	constructor() {
		this._store = {};
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @param requestContext The context for the request.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array, requestContext?: IServiceRequestContext): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		const id = Converter.bytesToHex(Sha256.sum256(blob));

		this._store[requestContext.partitionId] ??= {};
		this._store[requestContext.partitionId][id] = blob;

		return `blob:${new Urn(MemoryBlobStorageConnector.NAMESPACE, id).toString()}`;
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @param requestContext The context for the request.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(
		id: string,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array | undefined> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== MemoryBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: MemoryBlobStorageConnector.NAMESPACE,
				id
			});
		}

		return this._store[requestContext?.partitionId]?.[urnParsed.namespaceSpecific(1)];
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param requestContext The context for the request.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string, requestContext?: IServiceRequestContext): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== MemoryBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: MemoryBlobStorageConnector.NAMESPACE,
				id
			});
		}

		const namespaceId = urnParsed.namespaceSpecific(1);
		if (this._store[requestContext.partitionId]?.[namespaceId]) {
			delete this._store[requestContext.partitionId][namespaceId];
			return true;
		}
		return false;
	}

	/**
	 * Get the memory store for the specified partition.
	 * @param partitionId The partition id.
	 * @returns The store.
	 */
	public getStore(partitionId: string): { [id: string]: Uint8Array } | undefined {
		return this._store[partitionId];
	}
}
