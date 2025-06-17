// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

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
		encodingFormat?: string;

		/**
		 * The extension of the blob, will be detected if left undefined.
		 */
		fileExtension?: string;

		/**
		 * Custom metadata to associate with the blob as JSON-LD.
		 */
		metadata?: IJsonLdNodeObject;

		/**
		 * Disables encryption if enabled by default.
		 * @default false
		 */
		disableEncryption?: boolean;

		/**
		 * Use a different vault key id for encryption, if not provided the default vault key id will be used.
		 * @default undefined
		 */
		overrideVaultKeyId?: string;
	};
}
