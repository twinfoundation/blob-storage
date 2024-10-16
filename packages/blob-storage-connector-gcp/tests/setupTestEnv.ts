// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards, Is } from "@twin.org/core";
import * as dotenv from "dotenv";
import type { IGcpBlobStorageConnectorConfig } from "../src/models/IGcpBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_GCP_PROJECT_ID", process.env.TEST_GCP_PROJECT_ID);
Guards.stringValue("TestEnv", "TEST_GCP_BUCKET", process.env.TEST_GCP_BUCKET);
Guards.stringValue("TestEnv", "TEST_GCP_API_ENDPOINT", process.env.TEST_GCP_API_ENDPOINT);

if (Is.stringValue(process.env.TEST_GCP_CREDENTIALS)) {
	Guards.stringBase64("TestEnv", "TEST_GCP_CREDENTIALS", process.env.TEST_GCP_CREDENTIALS);
}

export const TEST_GCP_CONFIG: IGcpBlobStorageConnectorConfig = {
	projectId: process.env.TEST_GCP_PROJECT_ID,
	bucketName: process.env.TEST_GCP_BUCKET,
	apiEndpoint: process.env.TEST_GCP_API_ENDPOINT,
	credentials: Is.stringValue(process.env.TEST_GCP_CREDENTIALS)
		? process.env.TEST_GCP_CREDENTIALS
		: undefined
};
