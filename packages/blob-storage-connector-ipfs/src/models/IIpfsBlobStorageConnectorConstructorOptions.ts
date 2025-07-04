// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IIpfsBlobStorageConnectorConfig } from "./IIpfsBlobStorageConnectorConfig";

/**
 * Options for the IPFS Blob Storage Connector constructor.
 */
export interface IIpfsBlobStorageConnectorConstructorOptions {
	/**
	 * The configuration for the connector.
	 */
	config: IIpfsBlobStorageConnectorConfig;
}
