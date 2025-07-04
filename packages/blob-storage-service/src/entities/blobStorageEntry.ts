// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { BlobStorageCompressionType } from "@twin.org/blob-storage-models";
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
	@property({
		type: "string",
		format: "date-time",
		sortDirection: SortDirection.Descending,
		optional: true
	})
	public dateModified?: string;

	/**
	 * The length of the data in the blob.
	 */
	@property({ type: "number" })
	public blobSize!: number;

	/**
	 * The hash of the data in the blob.
	 */
	@property({ type: "string" })
	public blobHash!: string;

	/**
	 * The mime type for the blob.
	 */
	@property({ type: "string", optional: true })
	public encodingFormat?: string;

	/**
	 * The extension.
	 */
	@property({ type: "string", optional: true })
	public fileExtension?: string;

	/**
	 * The metadata for the blob as JSON-LD.
	 */
	@property({ type: "object", itemTypeRef: "IJsonLdNodeObject", optional: true })
	public metadata?: IJsonLdNodeObject;

	/**
	 * Is the entry encrypted.
	 */
	@property({ type: "boolean" })
	public isEncrypted!: boolean;

	/**
	 * Is the entry compressed.
	 */
	@property({ type: "string", optional: true })
	public compression?: BlobStorageCompressionType;

	/**
	 * The user identity that created the blob.
	 */
	@property({ type: "string", optional: true })
	public userIdentity?: string;

	/**
	 * The node identity that created the blob.
	 */
	@property({ type: "string", optional: true })
	public nodeIdentity?: string;
}
