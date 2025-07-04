// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the IPFS Blob Storage Connector.
 */
export interface IIpfsBlobStorageConnectorConfig {
	/**
	 * The url for API calls.
	 */
	apiUrl: string;

	/**
	 * The bearer token for authentication to the API.
	 */
	bearerToken?: string;
}
