// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IServiceRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing an blob storage service.
 */
export interface IBlobStorage extends IService {
	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @param options Additional options for the blob service.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @param requestContext The context for the request.
	 * @returns The id of the stored blob in urn format.
	 */
	set(
		blob: Uint8Array,
		options?: {
			namespace?: string;
		},
		requestContext?: IServiceRequestContext
	): Promise<string>;

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @param requestContext The context for the request.
	 * @returns The data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(id: string, requestContext?: IServiceRequestContext): Promise<Uint8Array>;

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param requestContext The context for the request.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	remove(id: string, requestContext?: IServiceRequestContext): Promise<void>;
}
