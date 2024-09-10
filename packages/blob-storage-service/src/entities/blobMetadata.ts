// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IJsonLdNodeObject } from "@gtsc/data-json-ld";
import { entity, property } from "@gtsc/entity";

/**
 * Class representing metadata for the blob storage.
 */
@entity()
export class BlobMetadata {
	/**
	 * The id for the blob.
	 */
	@property({ type: "string", isPrimary: true })
	public id!: string;

	/**
	 * The mime type for the blob.
	 */
	@property({ type: "string" })
	public mimeType?: string;

	/**
	 * The extension.
	 */
	@property({ type: "string" })
	public extension?: string;

	/**
	 * The metadata for the blob as JSON-LD.
	 */
	@property({ type: "object", itemTypeRef: "IJsonLdNodeObject" })
	public metadata?: IJsonLdNodeObject;
}
