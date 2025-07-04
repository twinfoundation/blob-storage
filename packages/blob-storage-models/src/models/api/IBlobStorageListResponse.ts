// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@twin.org/web";
import type { IBlobStorageEntryList } from "../IBlobStorageEntryList";

/**
 * Response to getting the list of entries from a query.
 */
export interface IBlobStorageListResponse {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.ContentType]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

	/**
	 * The list of entries from the query.
	 */
	body: IBlobStorageEntryList;
}
