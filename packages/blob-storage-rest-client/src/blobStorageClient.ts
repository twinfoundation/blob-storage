// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@gtsc/api-core";
import type { IBaseRestClientConfig, ICreatedResponse, INoContentResponse } from "@gtsc/api-models";
import type {
	IBlobStorageComponent,
	IBlobStorageCreateRequest,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageUpdateRequest
} from "@gtsc/blob-storage-models";
import { Guards, Is, StringHelper, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";

/**
 * Client for performing blob storage through to REST endpoints.
 */
export class BlobStorageClient extends BaseRestClient implements IBlobStorageComponent {
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
		super(BlobStorageClient._CLASS_NAME, config, "blob");
	}

	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		mimeType?: string,
		extension?: string,
		metadata?: unknown,
		namespace?: string
	): Promise<string> {
		Guards.stringBase64(this.CLASS_NAME, nameof(blob), blob);

		const response = await this.fetch<IBlobStorageCreateRequest, ICreatedResponse>("/", "POST", {
			body: {
				blob,
				mimeType,
				extension,
				metadata,
				namespace
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
		mimeType?: string;
		extension?: string;
		metadata?: unknown;
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

		return {
			blob: response.body.blob,
			metadata: {
				mimeType: response.body.mimeType,
				extension: response.body.extension,
				data: response.body.metadata
			}
		};
	}

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async update(
		id: string,
		mimeType?: string,
		extension?: string,
		metadata?: unknown
	): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IBlobStorageUpdateRequest, INoContentResponse>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				mimeType,
				extension,
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
