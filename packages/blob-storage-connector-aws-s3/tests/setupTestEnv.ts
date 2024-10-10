// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import path from "node:path";
import { S3Client, CreateBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
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

/**
 * Create a test bucket for the tests.
 */
export async function createTestBucket(): Promise<void> {
	const s3Client = new S3Client({
		endpoint: process.env.TEST_S3_ENDPOINT,
		region: process.env.TEST_S3_REGION,
		credentials: {
			accessKeyId: process.env.TEST_S3_ACCESS_KEY ?? "",
			secretAccessKey: process.env.TEST_S3_SECRET_KEY ?? ""
		},
		forcePathStyle: true
	});

	console.log(`Attempting to connect to S3 endpoint '${process.env.TEST_S3_ENDPOINT}'`);

	try {
		const listBucketsCommand = new ListBucketsCommand({});
		console.log("Successfully connected to S3 endpoint.");
		const bucketsList = await s3Client.send(listBucketsCommand);
		const bucketExists = bucketsList.Buckets?.some(
			bucket => bucket.Name === process.env.TEST_S3_BUCKET
		);

		if (bucketExists) {
			console.log(`Test bucket '${process.env.TEST_S3_BUCKET}' already exists.`);
			return;
		}

		await s3Client.send(new CreateBucketCommand({ Bucket: process.env.TEST_S3_BUCKET }));
		console.log(`Test bucket '${process.env.TEST_S3_BUCKET}' created successfully.`);
	} catch (error) {
		if (error instanceof Error && error.name === "BucketAlreadyExists") {
			console.log(`Test bucket '${process.env.TEST_S3_BUCKET}' already exists.`);
		} else {
			console.error("Error creating test bucket:", error);
			throw error;
		}
	}
}
