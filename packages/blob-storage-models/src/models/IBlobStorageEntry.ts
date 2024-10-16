// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Interface describing a blob storage entry.
 */
export interface IBlobStorageEntry {
	/**
	 * The id for the blob.
	 */
	id: string;

	/**
	 * The mime type for the blob.
	 */
	mimeType?: string;

	/**
	 * The extension.
	 */
	extension?: string;

	/**
	 * The metadata for the blob as JSON-LD.
	 */
	metadata?: IJsonLdNodeObject;
}
