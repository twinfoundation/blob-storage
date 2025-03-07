// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement, IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { BlobStorageContexts } from "./blobStorageContexts";
import type { BlobStorageTypes } from "./blobStorageTypes";

/**
 * Interface describing a blob storage entry.
 */
export interface IBlobStorageEntry {
	/**
	 * JSON-LD Context.
	 */
	"@context": [
		typeof BlobStorageContexts.ContextRoot,
		typeof BlobStorageContexts.ContextRootCommon,
		...IJsonLdContextDefinitionElement[]
	];

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
	 * The hash of the data in the blob.
	 */
	blobHash: string;

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
	 * The blob in base64 format, included if the includeContent flag was set in the request.
	 */
	blob?: string;
}
