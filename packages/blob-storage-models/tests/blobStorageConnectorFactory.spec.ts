// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BlobStorageConnectorFactory } from "../src/factories/blobStorageConnectorFactory";
import type { IBlobStorageConnector } from "../src/models/IBlobStorageConnector";

describe("BlobStorageConnectorFactory", () => {
	test("can add an item to the factory", async () => {
		BlobStorageConnectorFactory.register(
			"my-blob-storage",
			() => ({}) as unknown as IBlobStorageConnector
		);
	});
});
