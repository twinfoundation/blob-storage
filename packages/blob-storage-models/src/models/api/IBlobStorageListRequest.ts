// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { SortDirection } from "@twin.org/entity";
import type { HeaderTypes, MimeTypes } from "@twin.org/web";
import type { IBlobStorageEntry } from "../IBlobStorageEntry";

/**
 * Query the entries from blob storage.
 */
export interface IBlobStorageListRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Accept]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The parameters from the query.
	 */
	query?: {
		/**
		 * The condition for the query as JSON version of EntityCondition type.
		 */
		conditions?: string;

		/**
		 * The order for the results, default to created.
		 */
		orderBy?: keyof Pick<IBlobStorageEntry, "dateCreated" | "dateModified">;

		/**
		 * The direction for the order, defaults to desc.
		 */
		orderByDirection?: SortDirection;

		/**
		 * The number of entries to return per page.
		 */
		pageSize?: number;

		/**
		 * The cursor to get next chunk of data, returned in previous response.
		 */
		cursor?: string;
	};
}
