// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { BlobStorageTypes } from "./blobStorageTypes";

/**
 * Interface describing a blob storage entry.
 */
export interface IBlobStorageEntry {
	/**
	 * JSON-LD Context.
	 */
	"@context":
		| typeof BlobStorageTypes.ContextRoot
		| [typeof BlobStorageTypes.ContextRoot, ...string[]];

	/**
	 * JSON-LD Type.
	 */
	type: typeof BlobStorageTypes.Entry;

	/**
	 * The id for the blob.
	 */
	id: string;

	/**
	 * The date/time when the entry was created.
	 */
	dateCreated: string;

	/**
	 * The date/time when the entry was modified.
	 */
	dateModified?: string;

	/**
	 * The size of the data in the blob.
	 */
	blobSize: number;

	/**
	 * The mime type for the blob.
	 */
	encodingFormat?: string;

	/**
	 * The extension.
	 */
	fileExtension?: string;

	/**
	 * The metadata for the blob as JSON-LD.
	 */
	metadata?: IJsonLdNodeObject;

	/**
	 * The blob in base64 format, if the includeContent flag was set in the request.
	 */
	blob?: string;
}
