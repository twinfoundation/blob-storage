// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of blob storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageTypes = {
	/**
	 * Represents blob storage entry.
	 */
	Entry: "BlobStorageEntry",

	/**
	 * Represents blob storage entry compression.
	 */
	CompressionType: "BlobStorageCompressionType"
} as const;

/**
 * The types of blob storage data.
 */
export type BlobStorageTypes = (typeof BlobStorageTypes)[keyof typeof BlobStorageTypes];
