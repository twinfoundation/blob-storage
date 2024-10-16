// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of blob storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageTypes = {
	/**
	 * The context root for the auditable item blob storage types.
	 */
	ContextRoot: "https://schema.twindev.org/blob-storage/",

	/**
	 * Represents blob storage entry.
	 */
	Entry: "BlobStorageEntry",

	/**
	 * Represents blob storage entry list.
	 */
	EntryList: "BlobStorageEntryList"
} as const;

/**
 * The types of blob storage data.
 */
export type BlobStorageTypes = (typeof BlobStorageTypes)[keyof typeof BlobStorageTypes];
