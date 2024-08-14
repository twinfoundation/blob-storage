// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IProperty } from "@gtsc/schema";

/**
 * Request to update a blob entry.
 */
export interface IBlobStorageUpdateRequest {
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
	 * The body parameters.
	 */
	body: {
		/**
		 * Metadata to associate with the blob.
		 */
		metadata: IProperty[];
	};
}
