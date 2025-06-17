// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IComponent } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { EntityCondition, SortDirection } from "@twin.org/entity";
import type { IBlobStorageEntry } from "./IBlobStorageEntry";
import type { IBlobStorageEntryList } from "./IBlobStorageEntryList";

/**
 * Interface describing an blob storage component.
 */
export interface IBlobStorageComponent extends IComponent {
	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param options Optional options for the creation of the blob.
	 * @param options.disableEncryption Disables encryption if enabled by default.
	 * @param options.overrideVaultKeyId Use a different vault key id for encryption, if not provided the default vault key id will be used.
	 * @param options.namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The id of the stored blob in urn format.
	 */
	create(
		blob: string,
		encodingFormat?: string,
		fileExtension?: string,
		metadata?: IJsonLdNodeObject,
		options?: {
			disableEncryption?: boolean;
			overrideVaultKeyId?: string;
			namespace?: string;
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<string>;

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param options Optional options for the retrieval of the blob.
	 * @param options.includeContent Include the content, or just get the metadata.
	 * @param options.disableDecryption Disables decryption if enabled by default.
	 * @param options.overrideVaultKeyId Use a different vault key id for decryption, if not provided the default vault key id will be used.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The data and metadata for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(
		id: string,
		options?: {
			includeContent?: boolean;
			disableDecryption?: boolean;
			overrideVaultKeyId?: string;
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IBlobStorageEntry>;

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	update(
		id: string,
		encodingFormat?: string,
		fileExtension?: string,
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

	/**
	 * Query all the blob storage entries which match the conditions.
	 * @param conditions The conditions to match for the entries.
	 * @param orderBy The order for the results, defaults to created.
	 * @param orderByDirection The direction for the order, defaults to descending.
	 * @param cursor The cursor to request the next page of entries.
	 * @param pageSize The suggested number of entries to return in each chunk, in some scenarios can return a different amount.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns All the entries for the storage matching the conditions,
	 * and a cursor which can be used to request more entities.
	 */
	query(
		conditions?: EntityCondition<IBlobStorageEntry>,
		orderBy?: keyof Pick<IBlobStorageEntry, "dateCreated" | "dateModified">,
		orderByDirection?: SortDirection,
		cursor?: string,
		pageSize?: number,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IBlobStorageEntryList>;
}
