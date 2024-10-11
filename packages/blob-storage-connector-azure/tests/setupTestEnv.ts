// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { BlobServiceClient } from "@azure/storage-blob";
import { Guards } from "@twin.org/core";
import * as dotenv from "dotenv";
import type { IAzureBlobStorageConnectorConfig } from "../src/models/IAzureBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_AZURE_CONNECTION", process.env.TEST_AZURE_CONNECTION);
Guards.stringValue("TestEnv", "TEST_AZURE_CONTAINER", process.env.TEST_AZURE_CONTAINER);
Guards.stringValue("TestEnv", "TEST_AZURE_BLOB_ENDPOINT", process.env.TEST_AZURE_BLOB_ENDPOINT);

export const TEST_AZURE_CONFIG: IAzureBlobStorageConnectorConfig = {
	connectionString: process.env.TEST_AZURE_CONNECTION,
	containerName: process.env.TEST_AZURE_CONTAINER,
	blobEndpoint: process.env.TEST_AZURE_BLOB_ENDPOINT
};

/**
 * Create a test container for the tests.
 */
export async function createTestContainer(): Promise<void> {
	const azureServiceClient = BlobServiceClient.fromConnectionString(
		(process.env.TEST_AZURE_CONNECTION ?? "") + (process.env.TEST_AZURE_BLOB_ENDPOINT ?? "")
	);

	console.log(`Attempting to connect to Blob endpoint '${process.env.TEST_AZURE_BLOB_ENDPOINT}'`);

	try {
		const containerClient = azureServiceClient.getContainerClient(
			process.env.TEST_AZURE_CONTAINER ?? ""
		);

		const exists = await containerClient.exists();

		if (!exists) {
			await containerClient.create();
		}
	} catch (error) {
		console.error("Error creating azure container:", error);
	}
}
