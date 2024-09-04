// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IProperty } from "@gtsc/data-core";

/**
 * Response to get an entry from blob storage.
 */
export interface IBlobStorageGetResponse {
	/**
	 * The body parameters.
	 */
	body: {
		/**
		 * Metadata associated with the blob.
		 */
		metadata: IProperty[];

		/**
		 * The blob in base64 format, if the includeContent flag was set in the request.
		 */
		blob?: string;
	};
}
