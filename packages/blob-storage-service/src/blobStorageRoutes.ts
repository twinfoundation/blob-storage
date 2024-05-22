// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type {
	ICreatedResponse,
	IRestRoute,
	INotFoundResponse,
	INoContentResponse,
	ITag
} from "@gtsc/api-models";
import type {
	IBlobStorage,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageSetRequest
} from "@gtsc/blob-storage-models";
import { Converter, Guards } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import { ServiceFactory, type IRequestContext } from "@gtsc/services";
import { HttpStatusCodes } from "@gtsc/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "blobStorageRoutes";

/**
 * The tag to associate with the routes.
 */
export const tags: ITag[] = [
	{
		name: "Blob Storage",
		description: "Endpoints which are modelled to access a blob storage contract."
	}
];

/**
 * The REST routes for blob storage.
 * @param baseRouteName Prefix to prepend to the paths.
 * @param factoryServiceName The name of the service to use in the routes store in the ServiceFactory.
 * @returns The generated routes.
 */
export function generateRestRoutes(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const blobStorageSetRoute: IRestRoute<IBlobStorageSetRequest, ICreatedResponse> = {
		operationId: "blobStorageSet",
		summary: "Set a blob in to storage",
		tag: tags[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (requestContext, request, body) =>
			blobStorageSet(requestContext, factoryServiceName, request, body),
		requestType: {
			type: nameof<IBlobStorageSetRequest>(),
			examples: [
				{
					id: "blobStorageSetExample",
					request: {
						body: {
							blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw=="
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<ICreatedResponse>(),
				examples: [
					{
						id: "blobStorageSetResponseExample",
						response: {
							statusCode: HttpStatusCodes.CREATED,
							headers: {
								location:
									"blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
							}
						}
					}
				]
			}
		]
	};

	const blobStorageGetRoute: IRestRoute<IBlobStorageGetRequest, IBlobStorageGetResponse> = {
		operationId: "blobStorageGet",
		summary: "Get the blob from storage",
		tag: tags[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (requestContext, request, body) =>
			blobStorageGet(requestContext, factoryServiceName, request, body),
		requestType: {
			type: nameof<IBlobStorageGetRequest>(),
			examples: [
				{
					id: "blobStorageGetRequestExample",
					request: {
						path: {
							id: "blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<IBlobStorageGetResponse>(),
				examples: [
					{
						id: "blobStorageGetResponseExample",
						response: {
							body: {
								blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw=="
							}
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	const blobStorageRemoveRoute: IRestRoute<IBlobStorageRemoveRequest, void> = {
		operationId: "blobStorageRemove",
		summary: "Remove the blob from storage",
		tag: tags[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (requestContext, request, body) =>
			blobStorageRemove(requestContext, factoryServiceName, request, body),
		requestType: {
			type: nameof<IBlobStorageRemoveRequest>(),
			examples: [
				{
					id: "blobStorageRemoveRequestExample",
					request: {
						path: {
							id: "blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			},
			{
				type: nameof<INotFoundResponse>()
			}
		]
	};

	return [blobStorageSetRoute, blobStorageGetRoute, blobStorageRemoveRoute];
}

/**
 * Set a blob in storage.
 * @param requestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @param body The body if required for pure content.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageSet(
	requestContext: IRequestContext,
	factoryServiceName: string,
	request: IBlobStorageSetRequest,
	body?: unknown
): Promise<ICreatedResponse> {
	Guards.object<IBlobStorageSetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageSetRequest["body"]>(ROUTES_SOURCE, nameof(request.body), request.body);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.blob), request.body.blob);

	const service = ServiceFactory.get<IBlobStorage>(factoryServiceName);
	const id = await service.set(requestContext, Converter.base64ToBytes(request.body.blob), {
		namespace: request.body.namespace
	});

	return {
		statusCode: HttpStatusCodes.CREATED,
		headers: {
			location: id
		}
	};
}

/**
 * Get the blob from storage.
 * @param requestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @param body The body if required for pure content.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageGet(
	requestContext: IRequestContext,
	serviceName: string,
	request: IBlobStorageGetRequest,
	body?: unknown
): Promise<IBlobStorageGetResponse> {
	Guards.object<IBlobStorageGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["path"]>(ROUTES_SOURCE, nameof(request.path), request.path);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.path.id), request.path.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	const result = await service.get(requestContext, request.path.id);

	return {
		body: {
			blob: Converter.bytesToBase64(result)
		}
	};
}

/**
 * Remove the blob from storage.
 * @param requestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @param body The body if required for pure content.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageRemove(
	requestContext: IRequestContext,
	serviceName: string,
	request: IBlobStorageRemoveRequest,
	body?: unknown
): Promise<void> {
	Guards.object<IBlobStorageRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["path"]>(ROUTES_SOURCE, nameof(request.path), request.path);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.path.id), request.path.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	await service.remove(requestContext, request.path.id);
}
