// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@gtsc/core";
import type { IProperty } from "@gtsc/schema";

/**
 * Interface describing an blob storage component.
 */
export interface IBlobStorageComponent extends IComponent {
	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param metadata Metadata to associate with the blob.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param nodeIdentity The node identity which controls the vault key.
	 * @returns The id of the stored blob in urn format.
	 */
	create(
		blob: string,
		metadata?: IProperty[],
		namespace?: string,
		nodeIdentity?: string
	): Promise<string>;

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @param nodeIdentity The node identity which controls the vault key.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(
		id: string,
		includeContent: boolean,
		nodeIdentity?: string
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
