// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageServiceConfig } from "./IBlobStorageServiceConfig";

/**
 * Options for the Blob Storage Service constructor.
 */
export interface IBlobStorageServiceConstructorOptions {
	/**
	 * The type of the storage connector for the metadata.
	 * @default blob-storage-entry
	 */
	entryEntityStorageType?: string;

	/**
	 * The type of the vault connector for encryption.
	 */
	vaultConnectorType?: string;

	/**
	 * The configuration for the service.
	 */
	config?: IBlobStorageServiceConfig;
}
