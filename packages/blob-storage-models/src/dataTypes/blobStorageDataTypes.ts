// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { DataTypeHandlerFactory } from "@twin.org/data-core";
import type { JSONSchema7 } from "json-schema";
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
		DataTypeHandlerFactory.register(BlobStorageTypes.Entry, () => ({
			type: BlobStorageTypes.Entry,
			defaultValue: {},
			jsonSchema: async () => BlobStorageEntrySchema as JSONSchema7
		}));
	}
}
