// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageEntry } from "../IBlobStorageEntry";

/**
 * Response to getting the list of entries from a query.
 */
export interface IBlobStorageListResponse {
	/**
	 * The list of entries from the query.
	 */
	body: {
		/**
		 * The entities from the query.
		 */
		entities: IBlobStorageEntry[];

		/**
		 * The cursor for the next page.
		 */
		cursor?: string;
	};
}
