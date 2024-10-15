// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Interface describing an blob storage component.
 */
export interface IBlobStorageComponent extends IComponent {
	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The id of the stored blob in urn format.
	 */
	create(
		blob: string,
		mimeType?: string,
		extension?: string,
		metadata?: IJsonLdNodeObject,
		namespace?: string,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<string>;

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The data and metadata for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(
		id: string,
		includeContent: boolean,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<{
		blob?: string;
		mimeType?: string;
		extension?: string;
		metadata?: IJsonLdNodeObject;
	}>;

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	update(
		id: string,
		mimeType?: string,
		extension?: string,
		metadata?: IJsonLdNodeObject,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<void>;

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	remove(id: string, userIdentity?: string, nodeIdentity?: string): Promise<void>;
}
