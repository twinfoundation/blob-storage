// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BlobStorageConnectorFactory,
	type IBlobStorageComponent,
	type IBlobStorageConnector
} from "@twin.org/blob-storage-models";
import {
	Converter,
	GeneralError,
	Guards,
	Is,
	type IValidationFailure,
	NotFoundError,
	ObjectHelper,
	Urn,
	Validation
} from "@twin.org/core";
import { JsonLdHelper, type IJsonLdNodeObject } from "@twin.org/data-json-ld";
import {
	ComparisonOperator,
	type EntityCondition,
	EntitySchemaHelper,
	LogicalOperator
} from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	VaultConnectorFactory,
	VaultEncryptionType,
	type IVaultConnector
} from "@twin.org/vault-models";
import { MimeTypeHelper } from "@twin.org/web";
import type { BlobMetadata } from "./entities/blobMetadata";
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
	 * Include the node identity when performing storage operations, defaults to true.
	 * @internal
	 */
	private readonly _includeNodeIdentity: boolean;

	/**
	 * Include the user identity when performing storage operations, defaults to true.
	 * @internal
	 */
	private readonly _includeUserIdentity: boolean;

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
		this._includeNodeIdentity = options?.config?.includeNodeIdentity ?? true;
		this._includeUserIdentity = options?.config?.includeUserIdentity ?? true;
	}

	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		mimeType?: string,
		extension?: string,
		metadata?: IJsonLdNodeObject,
		namespace?: string,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<string> {
		Guards.stringBase64(this.CLASS_NAME, nameof(blob), blob);
		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
		}
		if (this._includeNodeIdentity || Is.notEmpty(this._vaultConnector)) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			const connectorNamespace = namespace ?? this._defaultNamespace;

			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			// Convert the base64 data into bytes
			let storeBlob = Converter.base64ToBytes(blob);

			// See if we can detect the mime type and default extension for the data.
			// If not already supplied by the caller. We have to perform this operation
			// on the unencrypted data.
			if (!Is.stringValue(mimeType)) {
				mimeType = await MimeTypeHelper.detect(storeBlob);
			}

			if (!Is.stringValue(extension) && Is.stringValue(mimeType)) {
				extension = await MimeTypeHelper.defaultExtension(mimeType);
			}

			if (Is.object(metadata)) {
				const validationFailures: IValidationFailure[] = [];
				JsonLdHelper.validate(metadata, validationFailures);
				Validation.asValidationError(this.CLASS_NAME, "metadata", validationFailures);
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

			// Now store the metadata in entity storage
			const blobMetadata: BlobMetadata = {
				id: blobId,
				mimeType,
				extension,
				metadata
			};

			const conditions: { property: keyof BlobMetadata; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				ObjectHelper.propertySet(blobMetadata, "userIdentity", userIdentity);
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				ObjectHelper.propertySet(blobMetadata, "nodeIdentity", nodeIdentity);
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}

			await this._metadataEntityStorage.set(blobMetadata, conditions);

			return blobId;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "createFailed", undefined, error);
		}
	}

	/**
	 * Get the blob and metadata.
	 * @param id The id of the blob to get in urn format.
	 * @param includeContent Include the content, or just get the metadata.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The metadata and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(
		id: string,
		includeContent: boolean,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<{
		blob?: string;
		mimeType?: string;
		extension?: string;
		metadata?: IJsonLdNodeObject;
	}> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const conditions: EntityCondition<BlobMetadata>[] = [];

		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
			conditions.push({
				property: "userIdentity",
				comparison: ComparisonOperator.Equals,
				value: userIdentity
			});
		}
		if (this._includeNodeIdentity || (Is.notEmpty(this._vaultConnector) && includeContent)) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
			conditions.push({
				property: "nodeIdentity",
				comparison: ComparisonOperator.Equals,
				value: nodeIdentity
			});
		}

		try {
			const blobMetadata = await this.internalGet(id, userIdentity, nodeIdentity);

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
				mimeType: blobMetadata?.mimeType,
				extension: blobMetadata?.extension,
				metadata: blobMetadata?.metadata
			};
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob metadata to update.
	 * @param mimeType Mime type for the blob, will be detected if left undefined.
	 * @param extension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async update(
		id: string,
		mimeType?: string,
		extension?: string,
		metadata?: IJsonLdNodeObject,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
		}
		if (this._includeNodeIdentity || Is.notEmpty(this._vaultConnector)) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			const blobMetadata = await this._metadataEntityStorage.get(id);

			if (Is.undefined(blobMetadata)) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}

			if (Is.object(metadata)) {
				const validationFailures: IValidationFailure[] = [];
				await JsonLdHelper.validate(metadata, validationFailures);
				Validation.asValidationError(this.CLASS_NAME, "metadata", validationFailures);
			}

			// Now store the metadata in entity storage
			const updatedBlobMetadata: BlobMetadata = {
				id: blobMetadata.id,
				mimeType: mimeType ?? blobMetadata.mimeType,
				extension: extension ?? blobMetadata.extension,
				metadata: metadata ?? blobMetadata.metadata
			};

			const conditions: { property: keyof BlobMetadata; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				ObjectHelper.propertySet(updatedBlobMetadata, "userIdentity", userIdentity);
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				ObjectHelper.propertySet(updatedBlobMetadata, "nodeIdentity", nodeIdentity);
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}

			await this._metadataEntityStorage.set(updatedBlobMetadata, conditions);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "updateFailed", undefined, error);
		}
	}

	/**
	 * Remove the blob.
	 * @param id The id of the blob to remove in urn format.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 */
	public async remove(id: string, userIdentity?: string, nodeIdentity?: string): Promise<void> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);
		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
		}
		if (this._includeNodeIdentity || Is.notEmpty(this._vaultConnector)) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			const blobStorageConnector = this.getConnector(id);

			const conditions: { property: keyof BlobMetadata; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}
			await this._metadataEntityStorage.remove(id, conditions);

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

	/**
	 * Get an entity.
	 * @param id The id of the entity to get, or the index value if secondaryIndex is set.
	 * @param secondaryIndex Get the item using a secondary index.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The object if it can be found or throws.
	 * @internal
	 */
	private async internalGet(
		id: string,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<BlobMetadata> {
		const conditions: EntityCondition<BlobMetadata>[] = [];

		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
			conditions.push({
				property: "userIdentity",
				comparison: ComparisonOperator.Equals,
				value: userIdentity
			});
		}
		if (this._includeNodeIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
			conditions.push({
				property: "nodeIdentity",
				comparison: ComparisonOperator.Equals,
				value: nodeIdentity
			});
		}

		let entity: BlobMetadata | undefined;
		if (conditions.length === 0) {
			entity = await this._metadataEntityStorage.get(id);
		} else {
			const schema = this._metadataEntityStorage.getSchema();
			const primaryKey = EntitySchemaHelper.getPrimaryKey(schema);

			conditions.unshift({
				property: primaryKey.property,
				comparison: ComparisonOperator.Equals,
				value: id
			});

			const results = await this._metadataEntityStorage.query(
				{
					conditions,
					logicalOperator: LogicalOperator.And
				},
				undefined,
				undefined,
				undefined,
				1
			);

			entity = results.entities[0] as BlobMetadata;
		}

		if (Is.empty(entity)) {
			throw new NotFoundError(this.CLASS_NAME, "entityNotFound", id);
		}

		ObjectHelper.propertyDelete(entity, "nodeIdentity");
		ObjectHelper.propertyDelete(entity, "userIdentity");

		return entity;
	}
}
