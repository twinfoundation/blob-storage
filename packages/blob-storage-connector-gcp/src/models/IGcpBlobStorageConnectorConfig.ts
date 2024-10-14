// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the GCP Blob Storage Connector.
 */
export interface IGcpBlobStorageConnectorConfig {
	/**
	 * The GCP project ID.
	 */
	projectId: string;

	/**
	 * The GCP credentials, a base64 encoded version of the JWTInput data type.
	 */
	credentials?: string;

	/**
	 * The GCP bucket name.
	 */
	bucketName: string;

	/**
	 * Optional endpoint for GCP Storage emulator.
	 */
	apiEndpoint?: string;
}
