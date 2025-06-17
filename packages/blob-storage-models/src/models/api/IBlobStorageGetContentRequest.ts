// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to get the content from blob storage.
 */
export interface IBlobStorageGetContentRequest {
	/**
	 * The path parameters.
	 */
	pathParams: {
		/**
		 * The id of the blob to get in urn format.
		 */
		id: string;
	};

	/**
	 * The query parameters.
	 */
	query?: {
		/**
		 * Disables decryption if enabled by default.
		 * @default false
		 */
		disableDecryption?: string;

		/**
		 * Use a different vault key id for decryption, if not provided the default vault key id will be used.
		 * @default undefined
		 */
		overrideVaultKeyId?: string;

		/**
		 * Set the download flag which should prompt the browser to save the file.
		 * Otherwise the browser should show the content inside the page.
		 * @default false
		 */
		download?: string;

		/**
		 * Set the filename to use when a download is triggered.
		 * A filename will be generated if not provided.
		 */
		filename?: string;
	};
}
