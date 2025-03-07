// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The contexts of blob storage data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageContexts = {
	/**
	 * The context root for the blob storage types.
	 */
	ContextRoot: "https://schema.twindev.org/blob-storage/",

	/**
	 * The context root for the common types.
	 */
	ContextRootCommon: "https://schema.twindev.org/common/"
} as const;

/**
 * The contexts of blob storage data.
 */
export type BlobStorageContexts = (typeof BlobStorageContexts)[keyof typeof BlobStorageContexts];
