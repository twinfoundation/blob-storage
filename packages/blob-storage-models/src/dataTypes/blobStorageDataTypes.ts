// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHandlerFactory, type IJsonSchema } from "@twin.org/data-core";
import { BlobStorageContexts } from "../models/blobStorageContexts";
import { BlobStorageTypes } from "../models/blobStorageTypes";
import BlobStorageEntrySchema from "../schemas/BlobStorageEntry.json";

/**
 * Handle all the data types for blob storage.
 */
export class BlobStorageDataTypes {
	/**
	 * Register all the data types.
	 */
	public static registerTypes(): void {
		DataTypeHandlerFactory.register(
			`${BlobStorageContexts.ContextRoot}${BlobStorageTypes.Entry}`,
			() => ({
				context: BlobStorageContexts.ContextRoot,
				type: BlobStorageTypes.Entry,
				defaultValue: {},
				jsonSchema: async () => BlobStorageEntrySchema as IJsonSchema
			})
		);
	}
}
