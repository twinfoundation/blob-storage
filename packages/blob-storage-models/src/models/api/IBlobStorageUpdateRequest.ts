// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdDocument } from "@gtsc/data-json-ld";

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
		 * The mime type of the blob, will be detected if left undefined.
		 */
		mimeType?: string;

		/**
		 * The extension of the blob, will be detected if left undefined.
		 */
		extension?: string;

		/**
		 * Custom metadata to associate with the blob as JSON-LD.
		 */
		metadata?: IJsonLdDocument;
	};
}
