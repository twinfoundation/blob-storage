// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IBlobStorageConnector } from "@gtsc/blob-storage-models";
import { GeneralError, Guards, StringHelper, Urn } from "@gtsc/core";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import type { IIpfsBlobStorageConnectorConfig } from "./models/IIpfsBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations on IPFS.
 * See https://docs.ipfs.tech/reference/kubo/rpc/ for more information.
 */
export class IpfsBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 * @internal
	 */
	public static readonly NAMESPACE: string = "blob-ipfs";

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
	 * Create a new instance of Ipfs.
	 * @param config The configuration for the blob storage connector.
	 */
	constructor(config: IIpfsBlobStorageConnectorConfig) {
		Guards.object<IIpfsBlobStorageConnectorConfig>(this.CLASS_NAME, nameof(config), config);
		Guards.stringValue(this.CLASS_NAME, nameof(config.apiUrl), config.apiUrl);

		this._config = config;
		this._config.apiUrl = StringHelper.trimTrailingSlashes(this._config.apiUrl);
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @param requestContext The context for the request.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array, requestContext?: IServiceRequestContext): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);

		try {
			const formBlob = new Blob([blob], { type: "application/octet-stream" });
			const formData = new FormData();
			formData.append("file", formBlob);

			const fetchOptions: RequestInit = {
				method: "POST",
				body: formData,
				headers: {
					accept: "application/json",
					"Content-Disposition": "form-data"
				}
			};

			if (this._config.bearerToken) {
				fetchOptions.headers = {
					Authorization: `Bearer ${this._config.bearerToken}`
				};
			}

			const response = await fetch(`${this._config.apiUrl}/add?pin=true`, fetchOptions);

			if (response.ok) {
				const result = (await response.json()) as {
					Name: string;
					Hash: string;
					Size: string;
				};

				return new Urn(IpfsBlobStorageConnector.NAMESPACE, result.Hash).toString();
			}

			throw new GeneralError(this.CLASS_NAME, "fetchFail", {
				message: response.statusText
			});
		} catch (err) {
			throw new GeneralError(this.CLASS_NAME, "setBlobFailed", undefined, err);
		}
	}

	/**
	 * Get the blob.
	 * @param id The id of the blob to get in urn format.
	 * @param requestContext The context for the request.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(
		id: string,
		requestContext?: IServiceRequestContext
	): Promise<Uint8Array | undefined> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IpfsBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IpfsBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const fetchOptions: RequestInit = {
				method: "POST",
				headers: {
					accept: "application/json"
				}
			};

			if (this._config.bearerToken) {
				fetchOptions.headers = {
					Authorization: `Bearer ${this._config.bearerToken}`
				};
			}

			const response = await fetch(
				`${this._config.apiUrl}/cat?arg=${urnParsed.namespaceSpecific()}`,
				fetchOptions
			);

			if (response.ok) {
				const result = await response.arrayBuffer();

				return new Uint8Array(result);
			}

			throw new GeneralError(this.CLASS_NAME, "fetchFail", {
				message: response.statusText
			});
		} catch {}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param requestContext The context for the request.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string, requestContext?: IServiceRequestContext): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== IpfsBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: IpfsBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const fetchOptions: RequestInit = {
				method: "POST",
				headers: {
					accept: "application/json"
				}
			};

			if (this._config.bearerToken) {
				fetchOptions.headers = {
					Authorization: `Bearer ${this._config.bearerToken}`
				};
			}

			const response = await fetch(
				`${this._config.apiUrl}/pin/rm?arg=${urnParsed.namespaceSpecific()}`,
				fetchOptions
			);

			if (response.ok) {
				return true;
			}

			throw new GeneralError(this.CLASS_NAME, "fetchFail", {
				message: response.statusText
			});
		} catch {
			return false;
		}
	}
}
