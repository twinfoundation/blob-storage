// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@gtsc/api-core";
import type { IBaseRestClientConfig, ICreatedResponse, INoContentResponse } from "@gtsc/api-models";
import type {
	IBlobStorage,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageSetRequest
} from "@gtsc/blob-storage-models";
import { Converter, Guards, StringHelper, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";

/**
 * Client for performing blob storage through to REST endpoints.
 */
export class BlobStorageClient extends BaseRestClient implements IBlobStorage {
	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<BlobStorageClient>();

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = BlobStorageClient._CLASS_NAME;

	/**
	 * Create a new instance of BlobStorageClient.
	 * @param config The configuration for the client.
	 */
	constructor(config: IBaseRestClientConfig) {
		super(BlobStorageClient._CLASS_NAME, config, StringHelper.kebabCase(nameof<IBlobStorage>()));
	}

	/**
	 * Set the blob.
	 * @param requestContext The context for the request.
	 * @param blob The data for the blob.
	 * @param options Additional options for the blob.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(
		requestContext: IRequestContext,
		blob: Uint8Array,
		options?: {
			namespace?: string;
		}
	): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		const response = await this.fetch<IBlobStorageSetRequest, ICreatedResponse>(
			requestContext,
			"/",
			"POST",
			{
				body: {
					blob: Converter.bytesToBase64(blob),
					namespace: options?.namespace
				}
			}
		);

		return response.headers.location;
	}

	/**
	 * Get the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(requestContext: IRequestContext, id: string): Promise<Uint8Array> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IBlobStorageGetRequest, IBlobStorageGetResponse>(
			requestContext,
			"/:id",
			"GET",
			{
				pathParams: {
					id
				}
			}
		);

		return Converter.base64ToBytes(response.body.blob);
	}

	/**
	 * Remove the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(requestContext: IRequestContext, id: string): Promise<void> {
		Guards.object<IRequestContext>(this.CLASS_NAME, nameof(requestContext), requestContext);
		Guards.stringValue(this.CLASS_NAME, nameof(requestContext.tenantId), requestContext.tenantId);
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IBlobStorageRemoveRequest, INoContentResponse>(
			requestContext,
			"/:id",
			"DELETE",
			{
				pathParams: {
					id
				}
			}
		);
	}
}
