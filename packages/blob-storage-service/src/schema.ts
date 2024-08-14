// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@gtsc/entity";
import { nameof } from "@gtsc/nameof";
import { BlobMetadata } from "./entities/blobMetadata";

/**
 * Initialize the schema for the blob storage entities.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<BlobMetadata>(), () =>
		EntitySchemaHelper.getSchema(BlobMetadata)
	);
}
