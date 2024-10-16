// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { BaseRestClient } from "@twin.org/api-core";
import {
	HttpParameterHelper,
	type IBaseRestClientConfig,
	type ICreatedResponse,
	type INoContentResponse
} from "@twin.org/api-models";
import type {
	IBlobStorageComponent,
	IBlobStorageCreateRequest,
	IBlobStorageEntry,
	IBlobStorageEntryList,
	IBlobStorageGetRequest,
	IBlobStorageGetResponse,
	IBlobStorageListRequest,
	IBlobStorageListResponse,
	IBlobStorageRemoveRequest,
	IBlobStorageUpdateRequest
} from "@twin.org/blob-storage-models";
import { Guards, Is, StringHelper, Urn } from "@twin.org/core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { EntityCondition, SortDirection } from "@twin.org/entity";
import { nameof } from "@twin.org/nameof";
import { HeaderTypes, MimeTypes } from "@twin.org/web";

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
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		encodingFormat?: string,
		fileExtension?: string,
		metadata?: IJsonLdNodeObject,
		namespace?: string
	): Promise<string> {
		Guards.stringBase64(this.CLASS_NAME, nameof(blob), blob);

		const response = await this.fetch<IBlobStorageCreateRequest, ICreatedResponse>("/", "POST", {
			body: {
				blob,
				encodingFormat,
				fileExtension,
				metadata,
				namespace
			}
		});

		return response.headers[HeaderTypes.Location];
	}

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(id: string, includeContent: boolean): Promise<IBlobStorageEntry> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const response = await this.fetch<IBlobStorageGetRequest, IBlobStorageGetResponse>(
			"/:id",
			"GET",
			{
				headers: {
					[HeaderTypes.Accept]: MimeTypes.JsonLd
				},
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
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async update(
		id: string,
		encodingFormat?: string,
		fileExtension?: string,
		metadata?: IJsonLdNodeObject
	): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		await this.fetch<IBlobStorageUpdateRequest, INoContentResponse>("/:id", "PUT", {
			pathParams: {
				id
			},
			body: {
				encodingFormat,
				fileExtension,
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
	 * Query all the blob storage entries which match the conditions.
	 * @param conditions The conditions to match for the entries.
	 * @param sortProperties The optional sort order.
	 * @param cursor The cursor to request the next page of entries.
	 * @param pageSize The suggested number of entries to return in each chunk, in some scenarios can return a different amount.
	 * @returns All the entries for the storage matching the conditions,
	 * and a cursor which can be used to request more entities.
	 */
	public async query(
		conditions?: EntityCondition<IBlobStorageEntry>,
		sortProperties?: {
			property: keyof Pick<IBlobStorageEntry, "dateCreated" | "dateModified">;
			sortDirection: SortDirection;
		}[],
		cursor?: string,
		pageSize?: number
	): Promise<IBlobStorageEntryList> {
		const response = await this.fetch<IBlobStorageListRequest, IBlobStorageListResponse>(
			"/",
			"GET",
			{
				headers: {
					[HeaderTypes.Accept]: MimeTypes.JsonLd
				},
				query: {
					conditions: HttpParameterHelper.objectToString(conditions),
					sortProperties: HttpParameterHelper.objectToString(sortProperties),
					pageSize,
					cursor
				}
			}
		);

		return response.body;
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
