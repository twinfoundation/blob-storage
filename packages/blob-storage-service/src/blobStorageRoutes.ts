// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type {
	ICreatedResponse,
	IHttpRequestContext,
	INoContentResponse,
	INotFoundResponse,
	IRestRoute,
	IRestRouteResponseOptions,
	ITag
} from "@gtsc/api-models";
import type {
	IBlobStorage,
	IBlobStorageGetRequest,
	IBlobStorageGetContentRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageCreateRequest,
	IBlobStorageUpdateRequest,
	IBlobStorageGetContentResponse
} from "@gtsc/blob-storage-models";
import { Converter, Guards, Is } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import { PropertyHelper } from "@gtsc/schema";
import { ServiceFactory } from "@gtsc/services";
import { HttpStatusCode } from "@gtsc/web";

/**
 * The source used when communicating about these routes.
 */
const ROUTES_SOURCE = "blobStorageRoutes";

/**
 * The tag to associate with the routes.
 */
export const tagsBlobStorage: ITag[] = [
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
export function generateRestRoutesBlobStorage(
	baseRouteName: string,
	factoryServiceName: string
): IRestRoute[] {
	const blobStorageCreateRoute: IRestRoute<IBlobStorageCreateRequest, ICreatedResponse> = {
		operationId: "blobStorageCreate",
		summary: "Create a blob in to storage",
		tag: tagsBlobStorage[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			blobStorageCreate(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IBlobStorageCreateRequest>(),
			examples: [
				{
					id: "blobStorageCreateExample",
					request: {
						body: {
							blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
							metadata: [
								{
									key: "filename",
									type: "https://schema.org/Text",
									value: "my-file.pdf"
								}
							]
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
						id: "blobStorageCreateResponseExample",
						response: {
							statusCode: HttpStatusCode.created,
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
		summary: "Get the blob metadata from storage",
		tag: tagsBlobStorage[0].name,
		method: "GET",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			blobStorageGet(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IBlobStorageGetRequest>(),
			examples: [
				{
					id: "blobStorageGetRequestExample",
					request: {
						pathParams: {
							id: "blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
						},
						query: {
							includeContent: true
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
								metadata: [
									{
										key: "filename",
										type: "https://schema.org/Text",
										value: "my-file.pdf"
									}
								],
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

	const blobStorageGetContentRoute: IRestRoute<
		IBlobStorageGetContentRequest,
		IBlobStorageGetContentResponse & IRestRouteResponseOptions
	> = {
		operationId: "blobStorageGetContent",
		summary: "Get the blob from storage",
		tag: tagsBlobStorage[0].name,
		method: "GET",
		path: `${baseRouteName}/:id/content`,
		handler: async (httpRequestContext, request) =>
			blobStorageGetContent(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IBlobStorageGetRequest>(),
			examples: [
				{
					id: "blobStorageGetContentRequestExample",
					request: {
						pathParams: {
							id: "blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
						},
						query: {
							download: true,
							filename: "my-file.pdf"
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INotFoundResponse>()
			}
		],
		responseContentType: [
			{
				mimeType: "application/octet-stream",
				description:
					"The content of the blob, which will be a specific mime type if one can be detected from the content (or set as mimeType in the metadata), or defaults to application/octet-stream."
			}
		]
	};

	const blobStorageUpdateRoute: IRestRoute<IBlobStorageUpdateRequest, INoContentResponse> = {
		operationId: "blobStorageUpdate",
		summary: "Update a blob metadata in storage",
		tag: tagsBlobStorage[0].name,
		method: "PUT",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			blobStorageUpdate(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IBlobStorageUpdateRequest>(),
			examples: [
				{
					id: "blobStorageUpdateExample",
					request: {
						pathParams: {
							id: "blob-memory:c57d94b088f4c6d2cb32ded014813d0c786aa00134c8ee22f84b1e2545602a70"
						},
						body: {
							metadata: [
								{
									key: "filename",
									type: "https://schema.org/Text",
									value: "my-file.pdf"
								}
							]
						}
					}
				}
			]
		},
		responseType: [
			{
				type: nameof<INoContentResponse>()
			}
		]
	};

	const blobStorageRemoveRoute: IRestRoute<IBlobStorageRemoveRequest, INoContentResponse> = {
		operationId: "blobStorageRemove",
		summary: "Remove the blob from storage",
		tag: tagsBlobStorage[0].name,
		method: "DELETE",
		path: `${baseRouteName}/:id`,
		handler: async (httpRequestContext, request) =>
			blobStorageRemove(httpRequestContext, factoryServiceName, request),
		requestType: {
			type: nameof<IBlobStorageRemoveRequest>(),
			examples: [
				{
					id: "blobStorageRemoveRequestExample",
					request: {
						pathParams: {
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

	return [
		blobStorageCreateRoute,
		blobStorageGetRoute,
		blobStorageGetContentRoute,
		blobStorageUpdateRoute,
		blobStorageRemoveRoute
	];
}

/**
 * Create a blob in storage.
 * @param httpRequestContext The request context for the API.
 * @param factoryServiceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageCreate(
	httpRequestContext: IHttpRequestContext,
	factoryServiceName: string,
	request: IBlobStorageCreateRequest
): Promise<ICreatedResponse> {
	Guards.object<IBlobStorageCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageCreateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.blob), request.body.blob);

	const service = ServiceFactory.get<IBlobStorage>(factoryServiceName);
	const id = await service.create(request.body.blob, request.body.metadata, {
		namespace: request.body.namespace
	});

	return {
		statusCode: HttpStatusCode.created,
		headers: {
			location: id
		}
	};
}

/**
 * Get the blob from storage.
 * @param httpRequestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageGet(
	httpRequestContext: IHttpRequestContext,
	serviceName: string,
	request: IBlobStorageGetRequest
): Promise<IBlobStorageGetResponse> {
	Guards.object<IBlobStorageGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	const result = await service.get(request.pathParams.id, request.query?.includeContent ?? false);

	return {
		body: {
			metadata: result.metadata,
			blob: result.blob
		}
	};
}

/**
 * Get the blob from storage.
 * @param httpRequestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageGetContent(
	httpRequestContext: IHttpRequestContext,
	serviceName: string,
	request: IBlobStorageGetContentRequest
): Promise<IBlobStorageGetContentResponse & IRestRouteResponseOptions> {
	Guards.object<IBlobStorageGetContentRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetContentRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	const result = await service.get(request.pathParams.id, true);

	let filename = request.query?.filename;
	if (!Is.stringValue(filename)) {
		const defaultExtension = PropertyHelper.getText(result.metadata, "defaultExtension");
		filename = `file.${defaultExtension ?? "bin"}`;
	}

	return {
		body: Is.stringBase64(result.blob) ? Converter.base64ToBytes(result.blob) : new Uint8Array(),
		attachment: {
			mimeType: PropertyHelper.getText(result.metadata, "mimeType") ?? "application/octet-stream",
			filename,
			inline: !(request.query?.download ?? false)
		}
	};
}

/**
 * Update the blob storage metadata.
 * @param httpRequestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageUpdate(
	httpRequestContext: IHttpRequestContext,
	serviceName: string,
	request: IBlobStorageUpdateRequest
): Promise<INoContentResponse> {
	Guards.object<IBlobStorageUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageUpdateRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	await service.update(request.pathParams.id, request.body.metadata);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Remove the blob from storage.
 * @param httpRequestContext The request context for the API.
 * @param serviceName The name of the service to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageRemove(
	httpRequestContext: IHttpRequestContext,
	serviceName: string,
	request: IBlobStorageRemoveRequest
): Promise<INoContentResponse> {
	Guards.object<IBlobStorageRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const service = ServiceFactory.get<IBlobStorage>(serviceName);

	await service.remove(request.pathParams.id);

	return {
		statusCode: HttpStatusCode.noContent
	};
}
