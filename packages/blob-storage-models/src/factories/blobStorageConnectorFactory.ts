// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@gtsc/core";
import type { IBlobStorageConnector } from "../models/IBlobStorageConnector";

/**
 * Factory for creating blob storage connectors.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const BlobStorageConnectorFactory = new Factory<IBlobStorageConnector>("blob-storage");
