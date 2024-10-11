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
	 * The GCP bucket name.
	 */
	bucketName: string;

	/**
	 * Optional endpoint for GCP Storage emulator.
	 */
	apiEndpoint?: string;

	/**
	 * The protocol to use for GCP Storage (e.g., 'http' or 'https').
	 * Defaults to 'https' if not specified.
	 */
	protocol?: "http" | "https";
}
