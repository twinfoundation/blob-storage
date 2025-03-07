// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdContextDefinitionElement } from "@twin.org/data-json-ld";
import type { BlobStorageContexts } from "./blobStorageContexts";
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
		typeof BlobStorageContexts.ContextRoot,
		typeof BlobStorageContexts.ContextRootCommon,
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
