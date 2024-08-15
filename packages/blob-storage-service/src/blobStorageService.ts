// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BlobStorageConnectorFactory,
	type IBlobStorageComponent,
	type IBlobStorageConnector
} from "@gtsc/blob-storage-models";
import {
	Converter,
	GeneralError,
	Guards,
	Is,
	MimeTypeHelper,
	NotFoundError,
	Urn
} from "@gtsc/core";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@gtsc/entity-storage-models";
import { nameof } from "@gtsc/nameof";
import { PropertyHelper, type IProperty } from "@gtsc/schema";
import {
	VaultConnectorFactory,
	VaultEncryptionType,
	type IVaultConnector
} from "@gtsc/vault-models";
import type { BlobMetadata } from "./entities/blobMetadata";
import type { BlobMetadataProperty } from "./entities/blobMetadataProperty";
import type { IBlobStorageServiceConfig } from "./models/IBlobStorageServiceConfig";

/**
 * Service for performing blob storage operations to a connector.
 */
export class BlobStorageService implements IBlobStorageComponent {
	/**
	 * The namespace supported by the blob storage service.
	 */
	public static readonly NAMESPACE: string = "blob";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<BlobStorageService>();

	/**
	 * The namespace of the default storage connector to use.
	 * Defaults to the first entry in the factory if not provided.
	 * @internal
	 */
	private readonly _defaultNamespace: string;

	/**
	 * The storage connector for the metadata.
	 * @internal
	 */
	private readonly _metadataEntityStorage: IEntityStorageConnector<BlobMetadata>;

	/**
	 * The vault connector for the encryption, can be undefined if no encryption required.
	 * @internal
	 */
	private readonly _vaultConnector?: IVaultConnector;

	/**
	 * The id of the vault key to use for encryption if the service has a vault connector configured.
	 * @internal
	 */
	private readonly _vaultKeyId: string;

	/**
	 * Create a new instance of BlobStorageService.
	 * @param options The dependencies for the service.
	 * @param options.metadataEntityStorageType The type of the storage connector for the metadata, defaults to "blob-metadata".
	 * @param options.vaultConnectorType The type of the vault connector for encryption, if undefined no encryption will be performed.
	 * @param options.config The configuration for the service.
	 */
	constructor(options?: {
		metadataEntityStorageType?: string;
		vaultConnectorType?: string;
		config?: IBlobStorageServiceConfig;
	}) {
		const names = BlobStorageConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}

		this._metadataEntityStorage = EntityStorageConnectorFactory.get(
			options?.metadataEntityStorageType ?? "blob-metadata"
		);
		if (Is.stringValue(options?.vaultConnectorType)) {
			this._vaultConnector = VaultConnectorFactory.getIfExists(options.vaultConnectorType);
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
		this._vaultKeyId = options?.config?.vaultKeyId ?? "blob-storage";
	}

	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param metadata Metadata to associate with the blob.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param nodeIdentity The node identity which controls the vault key.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		metadata?: IProperty[],
		namespace?: string,
		nodeIdentity?: string
	): Promise<string> {
		Guards.stringBase64(this.CLASS_NAME, nameof(blob), blob);
		if (this._vaultConnector) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			const connectorNamespace = namespace ?? this._defaultNamespace;

			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			// Convert the base64 data into bytes
			let storeBlob = Converter.base64ToBytes(blob);

			metadata ??= [];

			// See if we can detect the mime type and default extension for the data.
			// If not already supplied by the caller. We have to perform this operation
			// on the unencrypted data.
			let mimeType = PropertyHelper.getText(metadata, "mimeType");
			if (!Is.stringValue(mimeType)) {
				mimeType = await MimeTypeHelper.detect(storeBlob);
				PropertyHelper.setText(metadata, "mimeType", mimeType);
			}

			let defaultExtension = PropertyHelper.getText(metadata, "defaultExtension");
			if (!Is.stringValue(defaultExtension) && Is.stringValue(mimeType)) {
				defaultExtension = await MimeTypeHelper.defaultExtension(mimeType);
				PropertyHelper.setText(metadata, "defaultExtension", defaultExtension);
			}

			// If we have a vault connector then encrypt the data.
			if (this._vaultConnector) {
				storeBlob = await this._vaultConnector.encrypt(
					`${nodeIdentity}/${this._vaultKeyId}`,
					VaultEncryptionType.ChaCha20Poly1305,
					storeBlob
				);
			}

			// Set the blob in the storage connector, which may now be encrypted
			const blobId = await blobStorageConnector.set(storeBlob);

			// Convert the property list to a map to store it.
			const blobMetadata: { [key: string]: BlobMetadataProperty } = {};
			for (const item of metadata) {
				blobMetadata[item.key] = {
					type: item.type,
					value: item.value
				};
			}

			await this._metadataEntityStorage.set({
				id: blobId,
				metadata: blobMetadata
			});

			return blobId;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "createFailed", undefined, error);
		}
	}

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @param nodeIdentity The node identity which controls the vault key.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(
		id: string,
		includeContent: boolean,
		nodeIdentity?: string
	): Promise<{
		blob?: string;
		metadata: IProperty[];
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		if (this._vaultConnector && includeContent) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			// Get the metadata
			const blobMetadata = await this._metadataEntityStorage.get(id);

			// Convert the metadata map to a property list.
			const metadataList: IProperty[] = [];
			if (Is.objectValue(blobMetadata?.metadata)) {
				for (const key of Object.keys(blobMetadata.metadata)) {
					const item = blobMetadata.metadata[key];
					metadataList.push({
						key,
						type: item.type,
						value: item.value
					});
				}
			}

			let returnBlob: Uint8Array | undefined;
			if (includeContent) {
				const blobStorageConnector = this.getConnector(id);
				returnBlob = await blobStorageConnector.get(id);
				if (Is.undefined(returnBlob)) {
					throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
				}

				// If we have a vault connector then decrypt the data.
				if (this._vaultConnector) {
					returnBlob = await this._vaultConnector.decrypt(
						`${nodeIdentity}/${this._vaultKeyId}`,
						VaultEncryptionType.ChaCha20Poly1305,
						returnBlob
					);
				}
			}

			return {
				blob: Is.uint8Array(returnBlob) ? Converter.bytesToBase64(returnBlob) : undefined,
				metadata: metadataList
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
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

		try {
			const blobMetadata = await this._metadataEntityStorage.get(id);

			if (Is.undefined(blobMetadata)) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}

			// Convert the property list to a map to store it.
			const metadataMap: { [key: string]: BlobMetadataProperty } = {};
			for (const item of metadata) {
				metadataMap[item.key] = {
					type: item.type,
					value: item.value
				};
			}

			await this._metadataEntityStorage.set({
				id: blobMetadata.id,
				metadata: metadataMap
			});
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updateFailed", undefined, error);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @returns Nothing.
	 */
	public async remove(id: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		try {
			const blobStorageConnector = this.getConnector(id);

			const removed = await blobStorageConnector.remove(id);

			if (!removed) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}

	/**
	 * Get the connector from the uri.
	 * @param id The id of the blob storage item in urn format.
	 * @returns The connector.
	 * @internal
	 */
	private getConnector(id: string): IBlobStorageConnector {
		const idUri = Urn.fromValidString(id);

		if (idUri.namespaceIdentifier() !== BlobStorageService.NAMESPACE) {
			throw new GeneralError(this.CLASS_NAME, "namespaceMismatch", {
				namespace: BlobStorageService.NAMESPACE,
				id
			});
		}

		return BlobStorageConnectorFactory.get<IBlobStorageConnector>(idUri.namespaceMethod());
	}
}
