// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Azure Blob Storage Connector.
 */
export interface IAzureBlobStorageConnectorConfig {
	/**
	 * The Azure container name.
	 */
	containerName: string;

	/**
	 * Connection string.
	 */
	connectionString: string;

	/**
	 * Blob endpoint.
	 */
	blobEndpoint: string;
}
