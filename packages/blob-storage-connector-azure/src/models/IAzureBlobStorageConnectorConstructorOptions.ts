// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IAzureBlobStorageConnectorConfig } from "./IAzureBlobStorageConnectorConfig";

/**
 * Options for the Azure Blob Storage Connector constructor.
 */
export interface IAzureBlobStorageConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IAzureBlobStorageConnectorConfig;
}
