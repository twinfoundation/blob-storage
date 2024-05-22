// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@gtsc/core";
import * as dotenv from "dotenv";
import type { IIpfsBlobStorageConnectorConfig } from "../src/models/IIpfsBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.log("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_IPFS_API_URL", process.env.TEST_IPFS_API_URL);
Guards.stringValue("TestEnv", "TEST_IPFS_BEARER_TOKEN", process.env.TEST_IPFS_BEARER_TOKEN);

export const TEST_IPFS_CONFIG: IIpfsBlobStorageConnectorConfig = {
	apiUrl: process.env.TEST_IPFS_API_URL,
	bearerToken: process.env.TEST_IPFS_BEARER_TOKEN
};
