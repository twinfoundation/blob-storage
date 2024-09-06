// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Response to get an entry from blob storage.
 */
export interface IBlobStorageGetResponse {
	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The mime type of the blob.
		 */
		mimeType?: string;

		/**
		 * The extension of the blob.
		 */
		extension?: string;

		/**
		 * Custom metadata to associate with the blob as JSON-LD.
		 */
		metadata?: unknown;

		/**
		 * The blob in base64 format, if the includeContent flag was set in the request.
		 */
		blob?: string;
	};
}
