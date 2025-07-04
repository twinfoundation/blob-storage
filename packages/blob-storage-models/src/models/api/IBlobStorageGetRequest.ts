// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { HeaderTypes, MimeTypes } from "@twin.org/web";

/**
 * Request to get an entry from blob storage.
 */
export interface IBlobStorageGetRequest {
	/**
	 * The headers which can be used to determine the response data type.
	 */
	headers?: {
		[HeaderTypes.Accept]: typeof MimeTypes.Json | typeof MimeTypes.JsonLd;
	};

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
	 * The query parameters.
	 */
	query?: {
		/**
		 * Include the content in the response, otherwise only metadata is returned.
		 * @default false
		 */
		includeContent?: boolean | string;

		/**
		 * If the content should be decompressed, if it was compressed when stored, defaults to true.
		 * @default true
		 */
		decompress?: boolean | string;

		/**
		 * Use a different vault key id for decryption, if not provided the default vault key id will be used.
		 * @default undefined
		 */
		overrideVaultKeyId?: string;
	};
}
