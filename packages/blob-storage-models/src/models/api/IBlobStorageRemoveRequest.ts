// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to remove an entry from blob storage.
 */
export interface IBlobStorageRemoveRequest {
	/**
	 * The path parameters.
	 */
	path: {
		/**
		 * The id of the blob to remove in urn format.
		 */
		id: string;
	};
}
