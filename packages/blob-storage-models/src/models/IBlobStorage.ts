// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IProperty } from "@gtsc/schema";
import type { IService } from "@gtsc/services";

/**
 * Interface describing an blob storage service.
 */
export interface IBlobStorage extends IService {
	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param metadata Metadata to associate with the blob.
	 * @param options Additional options for the blob service.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	create(
		blob: string,
		metadata?: IProperty[],
		options?: {
			namespace?: string;
		}
	): Promise<string>;

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(
		id: string,
		includeContent: boolean
	): Promise<{
		blob?: string;
		metadata: IProperty[];
	}>;

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param metadata Metadata to associate with the blob.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	update(id: string, metadata: IProperty[]): Promise<void>;

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	remove(id: string): Promise<void>;
}
