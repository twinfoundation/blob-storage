// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IService } from "@gtsc/services";

/**
 * Interface describing an blob storage connector.
 */
export interface IBlobStorageConnector extends IService {
	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob in urn format.
	 */
	set(blob: Uint8Array): Promise<string>;

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	get(id: string): Promise<Uint8Array | undefined>;

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	remove(id: string): Promise<boolean>;
}
