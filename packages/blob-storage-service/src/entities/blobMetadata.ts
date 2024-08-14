// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@gtsc/entity";
import type { BlobMetadataProperty } from "./blobMetadataProperty";

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
	 * The metadata for the blob.
	 */
	@property({ type: "object", itemTypeRef: "BlobMetadataProperty" })
	public metadata?: {
		[key: string]: BlobMetadataProperty;
	};
}
