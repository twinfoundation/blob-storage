// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRestRouteEntryPoint } from "@gtsc/api-models";
import { generateRestRoutesBlobStorage, tagsBlobStorage } from "./blobStorageRoutes";

export const restEntryPoints: IRestRouteEntryPoint[] = [
	{
		name: "blobStorage",
		defaultBaseRoute: "blob-storage",
		tags: tagsBlobStorage,
		generateRoutes: generateRestRoutesBlobStorage
	}
];
