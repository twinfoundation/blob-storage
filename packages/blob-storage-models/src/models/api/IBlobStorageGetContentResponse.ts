// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Response to get an entry from blob storage.
 */
export interface IBlobStorageGetContentResponse {
	/**
	 * The body parameters.
	 */
	body: Uint8Array;
}
