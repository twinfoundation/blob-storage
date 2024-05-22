// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IBlobStorageConnector } from "@gtsc/blob-storage-models";
import { BaseError, Converter, FilenameHelper, GeneralError, Guards, Urn } from "@gtsc/core";
import { Sha256 } from "@gtsc/crypto";
import type { ILogging } from "@gtsc/logging-models";
import { nameof } from "@gtsc/nameof";
import type { IRequestContext } from "@gtsc/services";
import type { IFileBlobStorageConnectorConfig } from "./models/IFileBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations in file.
 */
export class FileBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "blob-file";

	/**
	 * Runtime name for the class.
	 * @internal
	 */
	private static readonly _CLASS_NAME: string = nameof<FileBlobStorageConnector>();

	/**
	 * The logging contract.
	 * @internal
	 */
	private readonly _logging: ILogging;

	/**
	 * The directory to use for storage.
	 * @internal
	 */
	private readonly _directory: string;

	/**
	 * The extension to use for storage.
	 * @internal
	 */
	private readonly _extension: string;

	/**
	 * Create a new instance of FileBlobStorageConnector.
	 * @param dependencies The dependencies for the connector.
	 * @param dependencies.logging The logging contract.
	 * @param config The configuration for the blob storage connector.
	 */
	constructor(
		dependencies: {
			logging: ILogging;
		},
		config: IFileBlobStorageConnectorConfig
	) {
		Guards.object(FileBlobStorageConnector._CLASS_NAME, nameof(dependencies), dependencies);
		Guards.object<ILogging>(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(dependencies.logging),
			dependencies.logging
		);
		Guards.object<FileBlobStorageConnector>(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(config),
			config
		);
		Guards.string(FileBlobStorageConnector._CLASS_NAME, nameof(config.directory), config.directory);
		this._logging = dependencies.logging;
		this._directory = path.resolve(config.directory);
		this._extension = config.extension ?? ".blob";
	}

	/**
	 * Bootstrap the connector by creating and initializing any resources it needs.
	 * @param requestContext The request context for bootstrapping.
	 * @returns The response of the bootstrapping as log entries.
	 */
	public async bootstrap(requestContext: IRequestContext): Promise<void> {
		if (!(await this.dirExists(this._directory))) {
			this._logging.log(requestContext, {
				level: "info",
				source: FileBlobStorageConnector._CLASS_NAME,
				message: "directoryCreating",
				data: {
					directory: this._directory
				}
			});

			try {
				await mkdir(this._directory, { recursive: true });

				this._logging.log(requestContext, {
					level: "info",
					source: FileBlobStorageConnector._CLASS_NAME,
					message: "directoryCreated",
					data: {
						directory: this._directory
					}
				});
			} catch (err) {
				this._logging.log(requestContext, {
					level: "error",
					source: FileBlobStorageConnector._CLASS_NAME,
					message: "directoryCreateFailed",
					data: {
						directory: this._directory
					},
					error: BaseError.fromError(err)
				});
			}
		} else {
			this._logging.log(requestContext, {
				level: "info",
				source: FileBlobStorageConnector._CLASS_NAME,
				message: "directoryExists",
				data: {
					directory: this._directory
				}
			});
		}
	}

	/**
	 * Set the blob.
	 * @param requestContext The context for the request.
	 * @param blob The data for the blob.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(requestContext: IRequestContext, blob: Uint8Array): Promise<string> {
		Guards.object<IRequestContext>(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Guards.uint8Array(FileBlobStorageConnector._CLASS_NAME, nameof(blob), blob);

		try {
			const tenantPath = await this.createTenantPath(requestContext, true);

			const id = Converter.bytesToHex(Sha256.sum256(blob));

			const fullPath = path.join(tenantPath, `${id}${this._extension}`);

			await writeFile(fullPath, blob);

			return new Urn(FileBlobStorageConnector.NAMESPACE, id).toString();
		} catch (err) {
			throw new GeneralError(FileBlobStorageConnector._CLASS_NAME, "setBlobFailed", undefined, err);
		}
	}

	/**
	 * Get the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to get in urn format.
	 * @returns The data for the blob if it can be found or undefined.
	 */
	public async get(requestContext: IRequestContext, id: string): Promise<Uint8Array | undefined> {
		Guards.object<IRequestContext>(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Urn.guard(FileBlobStorageConnector._CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== FileBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(FileBlobStorageConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: FileBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const tenantPath = await this.createTenantPath(requestContext, false);

			const fullPath = path.join(tenantPath, `${urnParsed.namespaceSpecific()}${this._extension}`);

			return await readFile(fullPath);
		} catch (err) {
			if (BaseError.isErrorCode(err, "ENOENT")) {
				return;
			}
			throw new GeneralError(FileBlobStorageConnector._CLASS_NAME, "getBlobFailed", { id }, err);
		}
	}

	/**
	 * Remove the blob.
	 * @param requestContext The context for the request.
	 * @param id The id of the blob to remove in urn format.
	 * @returns True if the blob was found.
	 */
	public async remove(requestContext: IRequestContext, id: string): Promise<boolean> {
		Guards.object<IRequestContext>(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext),
			requestContext
		);
		Guards.stringValue(
			FileBlobStorageConnector._CLASS_NAME,
			nameof(requestContext.tenantId),
			requestContext.tenantId
		);
		Urn.guard(FileBlobStorageConnector._CLASS_NAME, nameof(id), id);
		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceIdentifier() !== FileBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(FileBlobStorageConnector._CLASS_NAME, "namespaceMismatch", {
				namespace: FileBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const tenantPath = await this.createTenantPath(requestContext, false);

			const fullPath = path.join(tenantPath, `${urnParsed.namespaceSpecific()}${this._extension}`);

			await unlink(fullPath);

			return true;
		} catch (err) {
			if (BaseError.isErrorCode(err, "ENOENT")) {
				return false;
			}
			throw new GeneralError(FileBlobStorageConnector._CLASS_NAME, "removeBlobFailed", { id }, err);
		}

		return false;
	}

	/**
	 * Create the path and folder for tenant.
	 * @param create Create the tenant path if it doesn't exist.
	 * @returns The path with tenant included.
	 * @internal
	 */
	private async createTenantPath(
		requestContext: IRequestContext,
		create: boolean
	): Promise<string> {
		const tenantPath = path.join(
			this._directory,
			FilenameHelper.safeFilename(requestContext.tenantId)
		);
		if (create && !(await this.dirExists(tenantPath))) {
			await mkdir(tenantPath);
		}

		return tenantPath;
	}

	/**
	 * Check if the dir exists.
	 * @param dir The directory to check.
	 * @returns True if the dir exists.
	 * @internal
	 */
	private async dirExists(dir: string): Promise<boolean> {
		try {
			await access(dir);
			return true;
		} catch {
			return false;
		}
	}
}
