// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of compression for blob storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageCompressionType = {
	/**
	 * Gzip.
	 */
	Gzip: "gzip",
	/**
	 * Deflate.
	 */
	Deflate: "deflate"
} as const;

/**
 * The types of compression for blob storage data.
 */
export type BlobStorageCompressionType =
	(typeof BlobStorageCompressionType)[keyof typeof BlobStorageCompressionType];
