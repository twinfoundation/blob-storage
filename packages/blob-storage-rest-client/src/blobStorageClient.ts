// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@gtsc/api-core";
import type { IBaseRestClientConfig, ICreatedResponse, INoContentResponse } from "@gtsc/api-models";
import type {
	IBlobStorage,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageCreateRequest,
	IBlobStorageUpdateRequest
} from "@gtsc/blob-storage-models";
import { Converter, Guards, Is, StringHelper, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IProperty } from "@gtsc/schema";

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
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param metadata Metadata to associate with the blob.
	 * @param options Additional options for the blob service.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		metadata?: IProperty[],
		options?: {
			namespace?: string;
		}
	): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		const response = await this.fetch<IBlobStorageCreateRequest, ICreatedResponse>("/", "POST", {
			body: {
				blob: Converter.bytesToBase64(blob),
				metadata,
				namespace: options?.namespace
			}
		});

		return response.headers.location;
	}

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(
		id: string,
		includeContent: boolean
	): Promise<{
		blob?: string;
		metadata: IProperty[];
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IBlobStorageGetRequest, IBlobStorageGetResponse>(
			"/:id",
			"GET",
			{
				pathParams: {
					id
				},
				query: {
					includeContent
				}
			}
		);

		return response.body;
	}

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param metadata Metadata to associate with the blob.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async update(id: string, metadata: IProperty[]): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IBlobStorageUpdateRequest, INoContentResponse>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				metadata
			}
		});
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IBlobStorageRemoveRequest, INoContentResponse>("/:id", "DELETE", {
			pathParams: {
				id
			}
		});
	}

	/**
	 * Create a download link for the blob.
	 * @param id The id of the blob to get in urn format.
	 * @param download Should the content disposition be set to download.
	 * @param filename The filename to use for the download.
	 * @returns The download link.
	 */
	public createDownloadLink(id: string, download?: boolean, filename?: string): string {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		let link = StringHelper.trimTrailingSlashes(this.getEndpointWithPrefix());
		link += `/${id}/content`;

		const downloadQuery: string[] = [];
		if (download) {
			downloadQuery.push("download=true");
		}
		if (Is.stringValue(filename)) {
			downloadQuery.push(`filename=${encodeURIComponent(filename)}`);
		}
		if (downloadQuery.length > 0) {
			link += `?${downloadQuery.join("&")}`;
		}

		return link;
	}
}
