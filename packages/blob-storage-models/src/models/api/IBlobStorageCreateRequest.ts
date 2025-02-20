// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

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
		encodingFormat?: string;

		/**
		 * The extension of the blob, will be detected if left undefined.
		 */
		fileExtension?: string;

		/**
		 * Custom annotation object to associate with the blob as JSON-LD.
		 */
		annotationObject?: IJsonLdNodeObject;

		/**
		 * The namespace to store the data in, defaults to component configured namespace.
		 */
		namespace?: string;
	};
}
