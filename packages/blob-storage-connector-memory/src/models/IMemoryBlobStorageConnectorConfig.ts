// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the Memory Blob Storage Connector.
 */
export interface IMemoryBlobStorageConnectorConfig {
	/**
	 * Initial values to populate the blob storage with.
	 */
	initialValues?: { [tenantId: string]: { [id: string]: Uint8Array } };
}
