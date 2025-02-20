// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type { BlobStorageTypes } from "./blobStorageTypes";
import type { IBlobStorageEntry } from "./IBlobStorageEntry";

/**
 * Interface describing an blob storage entry list.
 */
export interface IBlobStorageEntryList {
	/**
	 * JSON-LD Context.
	 */
	"@context": [
		typeof BlobStorageTypes.ContextRoot,
		typeof BlobStorageTypes.ContextRootCommon,
		...IJsonLdContextDefinitionElement[]
	];

	/**
	 * JSON-LD Type.
	 */
	type: typeof BlobStorageTypes.EntryList;

	/**
	 * The list of entries.
	 */
	entries: IBlobStorageEntry[];

	/**
	 * The cursor to get the next chunk of entries.
	 */
	cursor?: string;
}
