// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Azure Blob Storage Connector.
 */
export interface IAzureBlobStorageConnectorConfig {
	/**
	 * Storage account name.
	 */
	accountName: string;

	/**
	 * Account key.
	 */
	accountKey: string;

	/**
	 * The Azure container name.
	 */
	containerName: string;

	/**
	 * Endpoint defaults to `https://{accountName}.blob.core.windows.net/` where accountName will be
	 * substituted.
	 */
	endpoint?: string;
}
