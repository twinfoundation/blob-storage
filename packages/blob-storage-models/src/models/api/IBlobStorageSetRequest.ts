// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Request to set an entry in blob storage.
 */
export interface IBlobStorageSetRequest {
	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The data to store in base64 encoding.
		 */
		blob: string;

		/**
		 * The namespace to store the data in, defaults to service configured namespace.
		 */
		namespace?: string;
	};
}
