// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { BlobStorageCompressionType } from "../blobStorageCompressionType";

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
		 * Custom metadata to associate with the blob as JSON-LD.
		 */
		metadata?: IJsonLdNodeObject;

		/**
		 * Disables encryption if enabled by default.
		 * @default false
		 */
		disableEncryption?: boolean;

		/**
		 * Optional compression type to use for the blob, defaults to no compression.
		 */
		compress?: BlobStorageCompressionType;

		/**
		 * Use a different vault key id for encryption, if not provided the default vault key id will be used.
		 * @default undefined
		 */
		overrideVaultKeyId?: string;

		/**
		 * The namespace to store the data in, defaults to component configured namespace.
		 */
		namespace?: string;
	};
}
