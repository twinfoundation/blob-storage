// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the blob storage service.
 */
export interface IBlobStorageServiceConfig {
	/**
	 * The namespace of the default storage connector to use.
	 * Defaults to the first entry in the factory if not provided.
	 */
	defaultNamespace?: string;
}
