// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IGcpBlobStorageConnectorConfig } from "./IGcpBlobStorageConnectorConfig";

/**
 * Options for the GCP Blob Storage Connector constructor.
 */
export interface IGcpBlobStorageConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IGcpBlobStorageConnectorConfig;
}
