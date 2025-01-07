// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IFileBlobStorageConnectorConfig } from "./IFileBlobStorageConnectorConfig";

/**
 * Options for the File Blob Storage Connector constructor.
 */
export interface IFileBlobStorageConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IFileBlobStorageConnectorConfig;
}
