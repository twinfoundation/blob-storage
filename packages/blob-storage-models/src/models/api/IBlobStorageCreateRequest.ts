// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IProperty } from "@gtsc/schema";

/**
 * Request to create an entry in blob storage.
 */
export interface IBlobStorageCreateRequest {
	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * The data to store in base64 encoding.
		 */
		blob: string;

		/**
		 * Metadata to associate with the blob.
		 */
		metadata?: IProperty[];

		/**
		 * The namespace to store the data in, defaults to service configured namespace.
		 */
		namespace?: string;
	};
}
