// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Guards } from "@gtsc/core";
import * as dotenv from "dotenv";
import type { IIpfsBlobStorageConnectorConfig } from "../src/models/IIpfsBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

process.stdout.write("Setting up test environment from .env and .env.dev files\n");

Guards.stringValue("TestEnv", "TEST_IPFS_API_URL", process.env.TEST_IPFS_API_URL);
Guards.stringValue("TestEnv", "TEST_IPFS_BEARER_TOKEN", process.env.TEST_IPFS_BEARER_TOKEN);
Guards.stringValue("TestEnv", "TEST_IPFS_PUBLIC_GATEWAY", process.env.TEST_IPFS_PUBLIC_GATEWAY);

export const TEST_IPFS_CONFIG: IIpfsBlobStorageConnectorConfig = {
	apiUrl: process.env.TEST_IPFS_API_URL,
	bearerToken: process.env.TEST_IPFS_BEARER_TOKEN
};

export const TEST_IPFS_PUBLIC_GATEWAY = process.env.TEST_IPFS_PUBLIC_GATEWAY;
