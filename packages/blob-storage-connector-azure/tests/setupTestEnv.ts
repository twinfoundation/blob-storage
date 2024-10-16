// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@twin.org/core";
import * as dotenv from "dotenv";
import type { IAzureBlobStorageConnectorConfig } from "../src/models/IAzureBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_AZURE_ACCOUNT_NAME", process.env.TEST_AZURE_ACCOUNT_NAME);
Guards.stringValue("TestEnv", "TEST_AZURE_ACCOUNT_KEY", process.env.TEST_AZURE_ACCOUNT_KEY);
Guards.stringValue("TestEnv", "TEST_AZURE_CONTAINER", process.env.TEST_AZURE_CONTAINER);
Guards.stringValue("TestEnv", "TEST_AZURE_ENDPOINT", process.env.TEST_AZURE_ENDPOINT);

export const TEST_AZURE_CONFIG: IAzureBlobStorageConnectorConfig = {
	accountName: process.env.TEST_AZURE_ACCOUNT_NAME,
	accountKey: process.env.TEST_AZURE_ACCOUNT_KEY,
	containerName: process.env.TEST_AZURE_CONTAINER,
	endpoint: process.env.TEST_AZURE_ENDPOINT
};
