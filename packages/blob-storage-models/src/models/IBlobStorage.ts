// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IRequestContext, IService } from "@gtsc/services";

/**
 * Interface describing an blob storage service.
 */
export interface IBlobStorage extends IService {
	/**
	 * Set the blob.
	 * @param requestContext The context for the request.
	 * @param blob The data for the blob.
	 * @param options Additional options for the blob service.
	 * @param options.namespace The namespace to use for storing, defaults to service configured namespace.
	 * @returns The id of the stored blob in urn format.
	 */
	set(
		requestContext: IRequestContext,
		blob: Uint8Array,
		options?: {
			namespace?: string;
		}
	): Promise<string>;

	/**
	 * Get the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	get(requestContext: IRequestContext, id: string): Promise<Uint8Array>;

	/**
	 * Remove the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	remove(requestContext: IRequestContext, id: string): Promise<void>;
}
