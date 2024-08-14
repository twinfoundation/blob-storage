// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { entity, property } from "@gtsc/entity";

/**
 * Class representing metadata property for the blob.
 */
@entity()
export class BlobMetadataProperty {
	/**
	 * Is type of the item.
	 */
	@property({ type: "string" })
	public type!: string;

	/**
	 * The value for the item.
	 */
	@property({ type: "object" })
	public value!: unknown;
}
