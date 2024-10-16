// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { entity, property, SortDirection } from "@twin.org/entity";

/**
 * Class representing entry for the blob storage.
 */
@entity()
export class BlobStorageEntry {
	/**
	 * The id for the blob.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The date/time when the entry was created.
	 */
	@property({ type: "string", format: "date-time", sortDirection: SortDirection.Descending })
	public dateCreated!: string;

	/**
	 * The date/time when the entry was modified.
	 */
	@property({ type: "string", format: "date-time", sortDirection: SortDirection.Descending })
	public dateModified?: string;

	/**
	 * The length of the data in the blob.
	 */
	@property({ type: "number" })
	public blobSize!: number;

	/**
	 * The mime type for the blob.
	 */
	@property({ type: "string" })
	public encodingFormat?: string;

	/**
	 * The extension.
	 */
	@property({ type: "string" })
	public fileExtension?: string;

	/**
	 * The metadata for the blob as JSON-LD.
	 */
	@property({ type: "object", itemTypeRef: "IJsonLdNodeObject" })
	public metadata?: IJsonLdNodeObject;

	/**
	 * The user identity that created the blob.
	 */
	@property({ type: "string" })
	public userIdentity?: string;

	/**
	 * The node identity that created the blob.
	 */
	@property({ type: "string" })
	public nodeIdentity?: string;
}
