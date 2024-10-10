// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageConnector } from "@twin.org/blob-storage-models";
import { GeneralError, Guards, Is, StringHelper, Urn } from "@twin.org/core";
import { nameof } from "@twin.org/nameof";
import { HeaderTypes, MimeTypes } from "@twin.org/web";
import type { IIpfsBlobStorageConnectorConfig } from "./models/IIpfsBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations on IPFS.
 * See https://docs.ipfs.tech/reference/kubo/rpc/ for more information.
 */
export class IpfsBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "ipfs";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<IpfsBlobStorageConnector>();

	/**
	 * The configuration for the connector.
	 * @internal
	 */
	private readonly _config: IIpfsBlobStorageConnectorConfig;

	/**
	 * Create a new instance of IpfsBlobStorageConnector.
	 * @param options The options for the connector.
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: { config: IIpfsBlobStorageConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object<IIpfsBlobStorageConnectorConfig>(
			this.CLASS_NAME,
			nameof(options.config),
			options.config
		);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.apiUrl), options.config.apiUrl);

		this._config = options.config;
		this._config.apiUrl = StringHelper.trimTrailingSlashes(this._config.apiUrl);
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		try {
			const formBlob = new Blob([blob], { type: MimeTypes.OctetStream });
			const formData = new FormData();
			formData.append("file", formBlob);

			const fetchOptions: RequestInit = {
				method: "POST",
				body: formData,
				headers: {
					[HeaderTypes.Accept]: MimeTypes.Json,
					[HeaderTypes.ContentDisposition]: "form-data"
				}
			};

			this.addSecurity(fetchOptions);

			const response = await fetch(`${this._config.apiUrl}/add?pin=true`, fetchOptions);

			if (response.ok) {
				const result = (await response.json()) as {
					Name: string;
					Hash: string;
					Size: string;
				};

				return `blob:${new Urn(IpfsBlobStorageConnector.NAMESPACE, result.Hash).toString()}`;
			}

			const error = await response.json();
			throw new GeneralError(this.CLASS_NAME, "fetchFail", error);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "setBlobFailed", undefined, err);
		}
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(id: string): Promise<Uint8Array | undefined> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IpfsBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IpfsBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const fetchOptions: RequestInit = {
				method: "POST",
				headers: {
					accept: MimeTypes.Json
				}
			};

			this.addSecurity(fetchOptions);

			const response = await fetch(
				`${this._config.apiUrl}/cat?arg=${urnParsed.namespaceSpecific(1)}`,
				fetchOptions
			);

			if (response.ok) {
				const result = await response.arrayBuffer();

				return new Uint8Array(result);
			}

			const error = await response.json();
			throw new GeneralError(this.CLASS_NAME, "fetchFail", error);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "getBlobFailed", undefined, err);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== IpfsBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IpfsBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const fetchOptions: RequestInit = {
				method: "POST",
				headers: {
					accept: MimeTypes.Json
				}
			};

			this.addSecurity(fetchOptions);

			const response = await fetch(
				`${this._config.apiUrl}/pin/rm?arg=${urnParsed.namespaceSpecific(1)}`,
				fetchOptions
			);

			if (response.ok) {
				return true;
			}

			const error = await response.json();
			throw new GeneralError(this.CLASS_NAME, "fetchFail", error);
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "removeBlobFailed", undefined, err);
		}
	}

	/**
	 * Add the security to the request.
	 * @param requestInit The request options.
	 * @internal
	 */
	private addSecurity(requestInit: RequestInit): void {
		if (Is.stringValue(this._config.bearerToken)) {
			requestInit.headers = {
				...requestInit.headers,
				Authorization: `Bearer ${this._config.bearerToken}`
			};
		}
	}
}
