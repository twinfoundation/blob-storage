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
	IBlobStorageComponent,
	IBlobStorageCreateRequest,
	IBlobStorageGetContentRequest,
	IBlobStorageGetContentResponse,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageUpdateRequest
} from "@gtsc/blob-storage-models";
import { ComponentFactory, Converter, Guards, Is } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import { HttpStatusCode, MimeTypeHelper, MimeTypes } from "@gtsc/web";

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
 * @param componentName The name of the component to use in the routes stored in the ComponentFactory.
 * @returns The generated routes.
 */
export function generateRestRoutesBlobStorage(
	baseRouteName: string,
	componentName: string
): IRestRoute[] {
	const blobStorageCreateRoute: IRestRoute<IBlobStorageCreateRequest, ICreatedResponse> = {
		operationId: "blobStorageCreate",
		summary: "Create a blob in to storage",
		tag: tagsBlobStorage[0].name,
		method: "POST",
		path: `${baseRouteName}/`,
		handler: async (httpRequestContext, request) =>
			blobStorageCreate(httpRequestContext, componentName, request),
		requestType: {
			type: nameof<IBlobStorageCreateRequest>(),
			examples: [
				{
					id: "blobStorageCreateExample",
					request: {
						body: {
							blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
							metadata: {
								"@context": "http://schema.org/",
								"@type": "DigitalDocument",
								name: "myfile.pdf"
							}
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
			blobStorageGet(httpRequestContext, componentName, request),
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
								metadata: {
									"@context": "http://schema.org/",
									"@type": "DigitalDocument",
									name: "myfile.pdf"
								},
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
			blobStorageGetContent(httpRequestContext, componentName, request),
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
				type: nameof<Uint8Array>(),
				mimeType: MimeTypes.OctetStream,
				examples: [
					{
						id: "blobStorageGetContentResponseExample",
						description: `The content of the blob, which will be a specific mime type if one can be detected from the content (or set as mimeType in the metadata), or defaults to ${MimeTypes.OctetStream}.`,
						response: {
							body: new Uint8Array()
						}
					}
				]
			},
			{
				type: nameof<INotFoundResponse>()
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
			blobStorageUpdate(httpRequestContext, componentName, request),
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
							metadata: {
								"@context": "http://schema.org/",
								"@type": "DigitalDocument",
								name: "myfile.pdf"
							}
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
			blobStorageRemove(httpRequestContext, componentName, request),
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
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageCreate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IBlobStorageCreateRequest
): Promise<ICreatedResponse> {
	Guards.object<IBlobStorageCreateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageCreateRequest["body"]>(
		ROUTES_SOURCE,
		nameof(request.body),
		request.body
	);
	Guards.stringBase64(ROUTES_SOURCE, nameof(request.body.blob), request.body.blob);

	const component = ComponentFactory.get<IBlobStorageComponent>(componentName);
	const id = await component.create(
		request.body.blob,
		request.body.mimeType,
		request.body.extension,
		request.body.metadata,
		request.body.namespace,
		httpRequestContext.nodeIdentity
	);

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
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageGet(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IBlobStorageGetRequest
): Promise<IBlobStorageGetResponse> {
	Guards.object<IBlobStorageGetRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IBlobStorageComponent>(componentName);

	const result = await component.get(
		request.pathParams.id,
		request.query?.includeContent ?? false,
		httpRequestContext.nodeIdentity
	);

	return {
		body: result
	};
}

/**
 * Get the blob from storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageGetContent(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IBlobStorageGetContentRequest
): Promise<IBlobStorageGetContentResponse & IRestRouteResponseOptions> {
	Guards.object<IBlobStorageGetContentRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetContentRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IBlobStorageComponent>(componentName);

	const result = await component.get(request.pathParams.id, true, httpRequestContext.nodeIdentity);

	const mimeType = result?.mimeType ?? MimeTypes.OctetStream;
	let filename = request.query?.filename;
	if (!Is.stringValue(filename)) {
		filename = `file.${result.extension ?? MimeTypeHelper.defaultExtension(mimeType)}`;
	}

	return {
		body: Is.stringBase64(result.blob) ? Converter.base64ToBytes(result.blob) : new Uint8Array(),
		attachment: {
			mimeType,
			filename,
			inline: !(request.query?.download ?? false)
		}
	};
}

/**
 * Update the blob storage metadata.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageUpdate(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IBlobStorageUpdateRequest
): Promise<INoContentResponse> {
	Guards.object<IBlobStorageUpdateRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageUpdateRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IBlobStorageComponent>(componentName);

	await component.update(
		request.pathParams.id,
		request.body.mimeType,
		request.body.extension,
		request.body.metadata
	);

	return {
		statusCode: HttpStatusCode.noContent
	};
}

/**
 * Remove the blob from storage.
 * @param httpRequestContext The request context for the API.
 * @param componentName The name of the component to use in the routes.
 * @param request The request.
 * @returns The response object with additional http response properties.
 */
export async function blobStorageRemove(
	httpRequestContext: IHttpRequestContext,
	componentName: string,
	request: IBlobStorageRemoveRequest
): Promise<INoContentResponse> {
	Guards.object<IBlobStorageRemoveRequest>(ROUTES_SOURCE, nameof(request), request);
	Guards.object<IBlobStorageGetRequest["pathParams"]>(
		ROUTES_SOURCE,
		nameof(request.pathParams),
		request.pathParams
	);
	Guards.stringValue(ROUTES_SOURCE, nameof(request.pathParams.id), request.pathParams.id);

	const component = ComponentFactory.get<IBlobStorageComponent>(componentName);

	await component.remove(request.pathParams.id);

	return {
		statusCode: HttpStatusCode.noContent
	};
}
