// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IBlobStorageConnector } from "@gtsc/blob-storage-models";
import { BaseError, Converter, FilenameHelper, GeneralError, Guards, Urn } from "@gtsc/core";
import { Sha256 } from "@gtsc/crypto";
import { LoggingConnectorFactory } from "@gtsc/logging-models";
import { nameof } from "@gtsc/nameof";
import type { IServiceRequestContext } from "@gtsc/services";
import type { IFileBlobStorageConnectorConfig } from "./models/IFileBlobStorageConnectorConfig";

/**
 * Class for performing blob storage operations in file.
 */
export class FileBlobStorageConnector implements IBlobStorageConnector {
	/**
	 * The namespace for the items.
	 */
	public static readonly NAMESPACE: string = "file";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<FileBlobStorageConnector>();

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
	 * @param options The options for the connector.
	 * @param options.config The configuration for the connector.
	 */
	constructor(options: { config: IFileBlobStorageConnectorConfig }) {
		Guards.object(this.CLASS_NAME, nameof(options), options);
		Guards.object(this.CLASS_NAME, nameof(options.config), options.config);
		Guards.stringValue(this.CLASS_NAME, nameof(options.config.directory), options.config.directory);
		this._directory = path.resolve(options.config.directory);
		this._extension = options.config.extension ?? ".blob";
	}

	/**
	 * Bootstrap the connector by creating and initializing any resources it needs.
	 * @param systemLoggingConnectorType The system logging connector type, defaults to "system-logging".
	 * @returns The response of the bootstrapping as log entries.
	 */
	public async bootstrap(systemLoggingConnectorType?: string): Promise<void> {
		const systemLogging = LoggingConnectorFactory.getIfExists(
			systemLoggingConnectorType ?? "system-logging"
		);

		if (!(await this.dirExists(this._directory))) {
			await systemLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				message: "directoryCreating",
				data: {
					directory: this._directory
				}
			});

			try {
				await mkdir(this._directory, { recursive: true });

				await systemLogging?.log({
					level: "info",
					source: this.CLASS_NAME,
					message: "directoryCreated",
					data: {
						directory: this._directory
					}
				});
			} catch (err) {
				await systemLogging?.log({
					level: "error",
					source: this.CLASS_NAME,
					message: "directoryCreateFailed",
					data: {
						directory: this._directory
					},
					error: BaseError.fromError(err)
				});
			}
		} else {
			await systemLogging?.log({
				level: "info",
				source: this.CLASS_NAME,
				message: "directoryExists",
				data: {
					directory: this._directory
				}
			});
		}
	}

	/**
	 * Set the blob.
	 * @param blob The data for the blob.
	 * @param requestContext The context for the request.
	 * @returns The id of the stored blob in urn format.
	 */
	public async set(blob: Uint8Array, requestContext?: IServiceRequestContext): Promise<string> {
		Guards.uint8Array(this.CLASS_NAME, nameof(blob), blob);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		try {
			const partitionPath = await this.createPartitionPath(requestContext.partitionId, true);

			const id = Converter.bytesToHex(Sha256.sum256(blob));

			const fullPath = path.join(partitionPath, `${id}${this._extension}`);

			await writeFile(fullPath, blob);

			return `blob:${new Urn(FileBlobStorageConnector.NAMESPACE, id).toString()}`;
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
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== FileBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: FileBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const partitionPath = await this.createPartitionPath(requestContext.partitionId, false);

			const fullPath = path.join(
				partitionPath,
				`${urnParsed.namespaceSpecific(1)}${this._extension}`
			);

			return await readFile(fullPath);
		} catch (err) {
			if (BaseError.isErrorCode(err, "ENOENT")) {
				return;
			}
			throw new GeneralError(this.CLASS_NAME, "getBlobFailed", { id }, err);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param requestContext The context for the request.
	 * @returns True if the blob was found.
	 */
	public async remove(id: string, requestContext?: IServiceRequestContext): Promise<boolean> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		Guards.stringValue(
			this.CLASS_NAME,
			nameof(requestContext?.partitionId),
			requestContext?.partitionId
		);

		const urnParsed = Urn.fromValidString(id);

		if (urnParsed.namespaceMethod() !== FileBlobStorageConnector.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: FileBlobStorageConnector.NAMESPACE,
				id
			});
		}

		try {
			const partitionPath = await this.createPartitionPath(requestContext.partitionId, false);

			const fullPath = path.join(
				partitionPath,
				`${urnParsed.namespaceSpecific(1)}${this._extension}`
			);

			await unlink(fullPath);

			return true;
		} catch (err) {
			if (BaseError.isErrorCode(err, "ENOENT")) {
				return false;
			}
			throw new GeneralError(this.CLASS_NAME, "removeBlobFailed", { id }, err);
		}
	}

	/**
	 * Create the path and folder for partition.
	 * @param create Create the partition path if it doesn't exist.
	 * @returns The path with partition included.
	 * @internal
	 */
	private async createPartitionPath(partitionId: string, create: boolean): Promise<string> {
		const partitionPath = path.join(this._directory, FilenameHelper.safeFilename(partitionId));
		if (create && !(await this.dirExists(partitionPath))) {
			await mkdir(partitionPath);
		}

		return partitionPath;
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
