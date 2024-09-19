// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { IBlobStorageConnector } from "../models/IBlobStorageConnector";

/**
 * Factory for creating blob storage connectors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageConnectorFactory =
	Factory.createFactory<IBlobStorageConnector>("blob-storage");
