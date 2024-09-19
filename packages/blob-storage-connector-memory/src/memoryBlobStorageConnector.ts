// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { Converter, GeneralError, Guards, Urn } from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { nameof } from "@twin.org/nameof";

/**
 * Class for performing blob storage operations in-memory.
 */
export class MemoryBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
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
	private readonly _store: { [id: string]: Uint8Array };

	/**
	 * Create a new instance of MemoryBlobStorageConnector.
	 */
	constructor() {
		this._store = {};
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		const id = Converter.bytesToHex(Sha256.sum256(blob));

		this._store[id] = blob;

		return `blob:${new Urn(MemoryBlobStorageConnector.NAMESPACE, id).toString()}`;
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(id: string): Promise<Uint8Array | undefined> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== MemoryBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: MemoryBlobStorageConnector.NAMESPACE,
				id
			});
		}

		return this._store[urnParsed.namespaceSpecific(1)];
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== MemoryBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: MemoryBlobStorageConnector.NAMESPACE,
				id
			});
		}

		const namespaceId = urnParsed.namespaceSpecific(1);
		if (this._store[namespaceId]) {
			delete this._store[namespaceId];
			return true;
		}
		return false;
	}

	/**
	 * Get the memory store.
	 * @returns The store.
	 */
	public getStore(): { [id: string]: Uint8Array } | undefined {
		return this._store;
	}
}
