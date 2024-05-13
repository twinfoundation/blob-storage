// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the File Blob Storage Connector.
 */
export interface IFileBlobStorageConnectorConfig {
	/**
	 * The directory to use for storage.
	 */
	directory: string;

	/**
	 * The extension to add to files when they are stored.
	 */
	extension?: string;
}
