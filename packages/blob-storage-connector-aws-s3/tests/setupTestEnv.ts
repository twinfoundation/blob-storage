// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@twin.org/core";
import * as dotenv from "dotenv";
import type { IS3BlobStorageConnectorConfig } from "../src/models/IS3BlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_S3_ENDPOINT", process.env.TEST_S3_ENDPOINT);
Guards.stringValue("TestEnv", "TEST_S3_REGION", process.env.TEST_S3_REGION);
Guards.stringValue("TestEnv", "TEST_S3_BUCKET", process.env.TEST_S3_BUCKET);
Guards.stringValue("TestEnv", "TEST_S3_ACCESS_KEY", process.env.TEST_S3_ACCESS_KEY);
Guards.stringValue("TestEnv", "TEST_S3_SECRET_KEY", process.env.TEST_S3_SECRET_KEY);

export const TEST_S3_CONFIG: IS3BlobStorageConnectorConfig = {
	endpoint: process.env.TEST_S3_ENDPOINT,
	region: process.env.TEST_S3_REGION,
  	bucketName: process.env.TEST_S3_BUCKET,
  	accessKeyId: process.env.TEST_S3_ACCESS_KEY,
  	secretAccessKey: process.env.TEST_S3_SECRET_KEY
};
