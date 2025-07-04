// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";
import { BlobStorageEntry } from "./entities/blobStorageEntry";

/**
 * Initialize the schema for the blob storage entities.
 */
export function initSchema(): void {
	EntitySchemaFactory.register(nameof<BlobStorageEntry>(), () =>
		EntitySchemaHelper.getSchema(BlobStorageEntry)
	);
}
