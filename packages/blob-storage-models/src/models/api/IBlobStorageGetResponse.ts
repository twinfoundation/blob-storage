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
		 * The blob in base64 format.
		 */
		blob: string;
	};
}
