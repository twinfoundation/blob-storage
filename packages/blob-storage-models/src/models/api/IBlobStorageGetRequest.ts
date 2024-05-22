// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to get an entry from blob storage.
 */
export interface IBlobStorageGetRequest {
	/**
	 * The path parameters.
	 */
	path: {
		/**
		 * The id of the blob to get in urn format.
		 */
		id: string;
	};
}
