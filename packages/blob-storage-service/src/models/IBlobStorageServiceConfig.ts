// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Configuration for the blob storage service.
 */
export interface IBlobStorageServiceConfig {
	/**
	 * The name of the vault key to use for encryption, if not configured no encryption will happen.
	 */
	vaultKeyId?: string;

	/**
	 * The namespace of the default storage connector to use.
	 * Defaults to the first entry in the factory if not provided.
	 */
	defaultNamespace?: string;

	/**
	 * Include the node identity when performing storage operations, defaults to true.
	 */
	includeNodeIdentity?: boolean;

	/**
	 * Include the user identity when performing storage operations, defaults to true.
	 */
	includeUserIdentity?: boolean;
}
