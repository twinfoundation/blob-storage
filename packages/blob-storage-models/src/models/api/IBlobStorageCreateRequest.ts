// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdDocument } from "@gtsc/data-json-ld";

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

		/**
		 * The namespace to store the data in, defaults to component configured namespace.
		 */
		namespace?: string;
	};
}
