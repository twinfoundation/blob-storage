// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@twin.org/api-models";
import { generateRestRoutesBlobStorage, tagsBlobStorage } from "./blobStorageRoutes";

/**
 * These are dummy entry points for the blob storage service.
 * In reality your application would create its own entry points based on the
 * blob types it wants to store, using a custom defaultBaseRoute.
 */
export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "blob-storage",
		defaultBaseRoute: "blob-storage",
		tags: tagsBlobStorage,
		generateRoutes: generateRestRoutesBlobStorage
	}
];
