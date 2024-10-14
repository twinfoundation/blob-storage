// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import { Converter, Guards, Is, ObjectHelper } from "@twin.org/core";
import * as dotenv from "dotenv";
import type { JWTInput } from "google-auth-library";
import type { IGcpBlobStorageConnectorConfig } from "../src/models/IGcpBlobStorageConnectorConfig";

dotenv.config({ path: [path.join(__dirname, ".env"), path.join(__dirname, ".env.dev")] });

console.debug("Setting up test environment from .env and .env.dev files");

Guards.stringValue("TestEnv", "TEST_GCP_PROJECT_ID", process.env.TEST_GCP_PROJECT_ID);
Guards.stringValue("TestEnv", "TEST_GCP_BUCKET", process.env.TEST_GCP_BUCKET);
Guards.stringValue("TestEnv", "TEST_GCP_API_ENDPOINT", process.env.TEST_GCP_API_ENDPOINT);

let credentials: JWTInput | undefined;
if (Is.stringValue(process.env.TEST_GCP_CREDENTIALS)) {
	Guards.stringBase64("TestEnv", "TEST_GCP_CREDENTIALS", process.env.TEST_GCP_CREDENTIALS);
	credentials = ObjectHelper.fromBytes<JWTInput>(
		Converter.base64ToBytes(process.env.TEST_GCP_CREDENTIALS)
	);
}

export const TEST_GCP_CONFIG: IGcpBlobStorageConnectorConfig = {
	projectId: process.env.TEST_GCP_PROJECT_ID,
	bucketName: process.env.TEST_GCP_BUCKET,
	apiEndpoint: process.env.TEST_GCP_API_ENDPOINT,
	credentials: Is.notEmpty(credentials) ? process.env.TEST_GCP_CREDENTIALS : undefined
};

/**
 * Create a test bucket for the tests.
 */
export async function createTestBucket(): Promise<void> {
	const storage = new Storage({
		projectId: TEST_GCP_CONFIG.projectId,
		apiEndpoint: TEST_GCP_CONFIG.apiEndpoint,
		credentials
	});

	console.log(`Attempting to connect to GCP Storage endpoint '${TEST_GCP_CONFIG.apiEndpoint}'`);

	try {
		const [buckets] = await storage.getBuckets();
		console.log("Successfully connected to GCP Storage endpoint.");
		const bucketExists = buckets.some(bucket => bucket.name === TEST_GCP_CONFIG.bucketName);

		if (bucketExists) {
			console.log(`Test bucket '${TEST_GCP_CONFIG.bucketName}' already exists.`);
			return;
		}

		await storage.createBucket(TEST_GCP_CONFIG.bucketName);
		console.log(`Test bucket '${TEST_GCP_CONFIG.bucketName}' created successfully.`);
	} catch (error) {
		console.error("Error creating test bucket:", error);
		throw error;
	}
}
