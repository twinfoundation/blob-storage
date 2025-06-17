// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import {
	BlobStorageConnectorFactory,
	BlobStorageContexts,
	BlobStorageTypes,
	type IBlobStorageComponent,
	type IBlobStorageConnector,
	type IBlobStorageEntry,
	type IBlobStorageEntryList
} from "@twin.org/blob-storage-models";
import {
	Converter,
	GeneralError,
	Guards,
	Is,
	NotFoundError,
	ObjectHelper,
	Urn,
	Validation,
	type IValidationFailure
} from "@twin.org/core";
import { Sha256 } from "@twin.org/crypto";
import { JsonLdHelper, JsonLdProcessor, type IJsonLdNodeObject } from "@twin.org/data-json-ld";
import {
	ComparisonOperator,
	EntitySchemaHelper,
	LogicalOperator,
	SortDirection,
	type EntityCondition
} from "@twin.org/entity";
import {
	EntityStorageConnectorFactory,
	type IEntityStorageConnector
} from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	SchemaOrgContexts,
	SchemaOrgDataTypes,
	SchemaOrgTypes
} from "@twin.org/standards-schema-org";
import {
	VaultConnectorFactory,
	VaultEncryptionType,
	type IVaultConnector
} from "@twin.org/vault-models";
import { MimeTypeHelper } from "@twin.org/web";
import type { BlobStorageEntry } from "./entities/blobStorageEntry";
import type { IBlobStorageServiceConstructorOptions } from "./models/IBlobStorageServiceConstructorOptions";

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
	private readonly _entryEntityStorage: IEntityStorageConnector<BlobStorageEntry>;

	/**
	 * The vault connector for the encryption, can be undefined if no encryption required.
	 * @internal
	 */
	private readonly _vaultConnector?: IVaultConnector;

	/**
	 * The id of the vault key to use for encryption if the service has a vault connector configured.
	 * @internal
	 */
	private readonly _vaultKeyId: string | undefined;

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
	 * @param options The options for the service.
	 */
	constructor(options?: IBlobStorageServiceConstructorOptions) {
		const names = BlobStorageConnectorFactory.names();
		if (names.length === 0) {
			throw new GeneralError(this.CLASS_NAME, "noConnectors");
		}

		this._entryEntityStorage = EntityStorageConnectorFactory.get(
			options?.entryEntityStorageType ?? "blob-storage-entry"
		);
		if (Is.stringValue(options?.vaultConnectorType)) {
			this._vaultConnector = VaultConnectorFactory.get(options.vaultConnectorType);
		}

		this._defaultNamespace = options?.config?.defaultNamespace ?? names[0];
		this._vaultKeyId = options?.config?.vaultKeyId;
		this._includeNodeIdentity = options?.config?.includeNodeIdentity ?? true;
		this._includeUserIdentity = options?.config?.includeUserIdentity ?? true;

		SchemaOrgDataTypes.registerRedirects();
	}

	/**
	 * Create the blob with some metadata.
	 * @param blob The data for the blob in base64 format.
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param options Optional options for the creation of the blob.
	 * @param options.disableEncryption Disables encryption if enabled by default.
	 * @param options.overrideVaultKeyId Use a different vault key id for encryption, if not provided the default vault key id will be used.
	 * @param options.namespace The namespace to use for storing, defaults to component configured namespace.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The id of the stored blob in urn format.
	 */
	public async create(
		blob: string,
		encodingFormat?: string,
		fileExtension?: string,
		metadata?: IJsonLdNodeObject,
		options?: {
			disableEncryption?: boolean;
			overrideVaultKeyId?: string;
			namespace?: string;
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<string> {
		Guards.stringBase64(this.CLASS_NAME, nameof(blob), blob);
		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
		}

		const disableEncryption = options?.disableEncryption ?? false;
		const vaultKeyId = options?.overrideVaultKeyId ?? this._vaultKeyId;
		const encryptionEnabled = !disableEncryption && Is.stringValue(vaultKeyId);

		if (this._includeNodeIdentity || encryptionEnabled) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
		}

		try {
			const connectorNamespace = options?.namespace ?? this._defaultNamespace;

			const blobStorageConnector =
				BlobStorageConnectorFactory.get<IBlobStorageConnector>(connectorNamespace);

			// Convert the base64 data into bytes
			let storeBlob = Converter.base64ToBytes(blob);
			const blobSize = storeBlob.length;

			// See if we can detect the mime type and default extension for the data.
			// If not already supplied by the caller. We have to perform this operation
			// on the unencrypted data.
			if (!Is.stringValue(encodingFormat)) {
				encodingFormat = await MimeTypeHelper.detect(storeBlob);
			}

			if (!Is.stringValue(fileExtension) && Is.stringValue(encodingFormat)) {
				fileExtension = await MimeTypeHelper.defaultExtension(encodingFormat);
			}

			if (Is.object(metadata)) {
				const validationFailures: IValidationFailure[] = [];
				JsonLdHelper.validate(metadata, validationFailures);
				Validation.asValidationError(this.CLASS_NAME, nameof(metadata), validationFailures);
			}

			const blobHash = `sha256:${Converter.bytesToBase64(Sha256.sum256(storeBlob))}`;

			// If we have a vault connector then encrypt the data.

			if (encryptionEnabled) {
				if (Is.empty(this._vaultConnector)) {
					throw new GeneralError(this.CLASS_NAME, "vaultConnectorNotConfigured");
				}
				storeBlob = await this._vaultConnector.encrypt(
					`${nodeIdentity}/${vaultKeyId}`,
					VaultEncryptionType.ChaCha20Poly1305,
					storeBlob
				);
			}

			// Set the blob in the storage connector, which may now be encrypted
			const blobId = await blobStorageConnector.set(storeBlob);

			// Now store the entry in entity storage
			const blobEntry: BlobStorageEntry = {
				id: blobId,
				dateCreated: new Date(Date.now()).toISOString(),
				blobSize,
				blobHash,
				encodingFormat,
				fileExtension,
				metadata,
				isEncrypted: encryptionEnabled
			};

			const conditions: { property: keyof BlobStorageEntry; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				ObjectHelper.propertySet(blobEntry, "userIdentity", userIdentity);
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				ObjectHelper.propertySet(blobEntry, "nodeIdentity", nodeIdentity);
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}

			await this._entryEntityStorage.set(blobEntry, conditions);

			return blobId;
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "createFailed", undefined, error);
		}
	}

	/**
	 * Get the blob entry.
	 * @param id The id of the blob to get in urn format.
	 * @param options Optional options for the retrieval of the blob.
	 * @param options.includeContent Include the content, or just get the metadata.
	 * @param options.disableDecryption Disables decryption if enabled by default.
	 * @param options.overrideVaultKeyId Use a different vault key id for decryption, if not provided the default vault key id will be used.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns The entry and data for the blob if it can be found.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async get(
		id: string,
		options?: {
			includeContent?: boolean;
			disableDecryption?: boolean;
			overrideVaultKeyId?: string;
		},
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IBlobStorageEntry> {
		Urn.guard(this.CLASS_NAME, nameof(id), id);

		const includeContent = options?.includeContent ?? false;
		const disableEncryption = options?.disableDecryption ?? false;
		const vaultKeyId = options?.overrideVaultKeyId ?? this._vaultKeyId;
		const decryptionEnabled = !disableEncryption && Is.stringValue(vaultKeyId);

		const conditions: EntityCondition<BlobStorageEntry>[] = [];

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
			const blobEntry = await this.internalGet(id, userIdentity, nodeIdentity);

			let returnBlob: Uint8Array | undefined;
			if (includeContent) {
				const blobStorageConnector = this.getConnector(id);
				returnBlob = await blobStorageConnector.get(id);
				if (Is.undefined(returnBlob)) {
					throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
				}

				// If we have a vault connector then decrypt the data.
				if (decryptionEnabled) {
					if (Is.empty(this._vaultConnector)) {
						throw new GeneralError(this.CLASS_NAME, "vaultConnectorNotConfigured");
					}
					returnBlob = await this._vaultConnector.decrypt(
						`${nodeIdentity}/${vaultKeyId}`,
						VaultEncryptionType.ChaCha20Poly1305,
						returnBlob
					);
				}
			}

			const jsonLd = this.entryToJsonLd(blobEntry, returnBlob);
			return JsonLdProcessor.compact(jsonLd, jsonLd["@context"]);
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "getFailed", undefined, error);
		}
	}

	/**
	 * Update the blob with metadata.
	 * @param id The id of the blob entry to update.
	 * @param encodingFormat Mime type for the blob, will be detected if left undefined.
	 * @param fileExtension Extension for the blob, will be detected if left undefined.
	 * @param metadata Data for the custom metadata as JSON-LD.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns Nothing.
	 * @throws Not found error if the blob cannot be found.
	 */
	public async update(
		id: string,
		encodingFormat?: string,
		fileExtension?: string,
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
			const blobEntry = await this._entryEntityStorage.get(id);

			if (Is.undefined(blobEntry)) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}

			if (Is.object(metadata)) {
				const validationFailures: IValidationFailure[] = [];
				await JsonLdHelper.validate(metadata, validationFailures);
				Validation.asValidationError(this.CLASS_NAME, nameof(metadata), validationFailures);
			}

			// Now store the entry in entity storage
			const updatedBlobEntry: BlobStorageEntry = {
				id: blobEntry.id,
				dateCreated: blobEntry.dateCreated,
				dateModified: new Date(Date.now()).toISOString(),
				blobSize: blobEntry.blobSize,
				blobHash: blobEntry.blobHash,
				encodingFormat: encodingFormat ?? blobEntry.encodingFormat,
				fileExtension: fileExtension ?? blobEntry.fileExtension,
				metadata: metadata ?? blobEntry.metadata,
				isEncrypted: blobEntry.isEncrypted
			};

			const conditions: { property: keyof BlobStorageEntry; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				ObjectHelper.propertySet(updatedBlobEntry, "userIdentity", userIdentity);
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				ObjectHelper.propertySet(updatedBlobEntry, "nodeIdentity", nodeIdentity);
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}

			await this._entryEntityStorage.set(updatedBlobEntry, conditions);
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

			const conditions: { property: keyof BlobStorageEntry; value: unknown }[] = [];
			if (this._includeUserIdentity) {
				conditions.push({ property: "userIdentity", value: userIdentity });
			}
			if (this._includeNodeIdentity) {
				conditions.push({ property: "nodeIdentity", value: nodeIdentity });
			}
			await this._entryEntityStorage.remove(id, conditions);

			const removed = await blobStorageConnector.remove(id);

			if (!removed) {
				throw new NotFoundError(this.CLASS_NAME, "blobNotFound", id);
			}
		} catch (error) {
			throw new GeneralError(this.CLASS_NAME, "removeFailed", undefined, error);
		}
	}

	/**
	 * Query all the blob storage entries which match the conditions.
	 * @param conditions The conditions to match for the entries.
	 * @param orderBy The order for the results, defaults to created.
	 * @param orderByDirection The direction for the order, defaults to descending.
	 * @param cursor The cursor to request the next page of entries.
	 * @param pageSize The suggested number of entries to return in each chunk, in some scenarios can return a different amount.
	 * @param userIdentity The user identity to use with storage operations.
	 * @param nodeIdentity The node identity to use with storage operations.
	 * @returns All the entries for the storage matching the conditions,
	 * and a cursor which can be used to request more entities.
	 */
	public async query(
		conditions?: EntityCondition<IBlobStorageEntry>,
		orderBy?: keyof Pick<IBlobStorageEntry, "dateCreated" | "dateModified">,
		orderByDirection?: SortDirection,
		cursor?: string,
		pageSize?: number,
		userIdentity?: string,
		nodeIdentity?: string
	): Promise<IBlobStorageEntryList> {
		const finalConditions: EntityCondition<IBlobStorageEntry> = {
			conditions: [],
			logicalOperator: LogicalOperator.And
		};

		if (this._includeNodeIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(nodeIdentity), nodeIdentity);
			finalConditions.conditions.push({
				property: "nodeIdentity",
				comparison: ComparisonOperator.Equals,
				value: nodeIdentity
			});
		}
		if (this._includeUserIdentity) {
			Guards.stringValue(this.CLASS_NAME, nameof(userIdentity), userIdentity);
			finalConditions.conditions.push({
				property: "userIdentity",
				comparison: ComparisonOperator.Equals,
				value: userIdentity
			});
		}

		if (!Is.empty(conditions)) {
			finalConditions.conditions.push(conditions);
		}

		const orderProperty = orderBy ?? "dateCreated";
		const orderDirection = orderByDirection ?? SortDirection.Descending;

		const result = await this._entryEntityStorage.query(
			finalConditions.conditions.length > 0 ? finalConditions : undefined,
			[
				{
					property: orderProperty,
					sortDirection: orderDirection
				}
			],
			undefined,
			cursor,
			pageSize
		);

		for (const entity of result.entities) {
			ObjectHelper.propertyDelete(entity, "nodeIdentity");
			ObjectHelper.propertyDelete(entity, "userIdentity");
		}

		let context: IBlobStorageEntryList["@context"] = [
			SchemaOrgContexts.ContextRoot,
			BlobStorageContexts.ContextRoot,
			BlobStorageContexts.ContextRootCommon
		];
		const entriesJsonLd = [];

		for (const entry of result.entities) {
			// The entries are never Partial as we don't allow custom property requests.
			entriesJsonLd.push(this.entryToJsonLd(entry as BlobStorageEntry));
			context = JsonLdProcessor.combineContexts(
				context,
				entry.metadata?.["@context"]
			) as IBlobStorageEntryList["@context"];
		}

		const jsonLd: IBlobStorageEntryList = {
			"@context": context,
			type: SchemaOrgTypes.ItemList,
			[SchemaOrgTypes.ItemListElement]: entriesJsonLd,
			[SchemaOrgTypes.NextItem]: result.cursor
		};

		return JsonLdProcessor.compact(jsonLd, jsonLd["@context"]);
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
	): Promise<BlobStorageEntry> {
		const conditions: EntityCondition<BlobStorageEntry>[] = [];

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

		let entity: BlobStorageEntry | undefined;
		if (conditions.length === 0) {
			entity = await this._entryEntityStorage.get(id);
		} else {
			const schema = this._entryEntityStorage.getSchema();
			const primaryKey = EntitySchemaHelper.getPrimaryKey(schema);

			conditions.unshift({
				property: primaryKey.property,
				comparison: ComparisonOperator.Equals,
				value: id
			});

			const results = await this._entryEntityStorage.query(
				{
					conditions,
					logicalOperator: LogicalOperator.And
				},
				undefined,
				undefined,
				undefined,
				1
			);

			entity = results.entities[0] as BlobStorageEntry;
		}

		if (Is.empty(entity)) {
			throw new NotFoundError(this.CLASS_NAME, "entityNotFound", id);
		}

		ObjectHelper.propertyDelete(entity, "nodeIdentity");
		ObjectHelper.propertyDelete(entity, "userIdentity");

		return entity;
	}

	/**
	 * Convert the entry to JSON-LD.
	 * @param entry The entry to convert.
	 * @param blob The optional blob to return.
	 * @returns The JSON-LD representation of the entry.
	 * @internal
	 */
	private entryToJsonLd(entry: BlobStorageEntry, blob?: Uint8Array): IBlobStorageEntry {
		const jsonLd: IBlobStorageEntry = {
			"@context": JsonLdProcessor.combineContexts(
				[
					BlobStorageContexts.ContextRoot,
					BlobStorageContexts.ContextRootCommon,
					SchemaOrgContexts.ContextRoot
				],
				entry?.metadata?.["@context"]
			) as IBlobStorageEntry["@context"],
			id: entry.id,
			type: BlobStorageTypes.Entry,
			dateCreated: entry.dateCreated,
			dateModified: entry.dateModified,
			blobSize: entry.blobSize,
			blobHash: entry.blobHash,
			encodingFormat: entry?.encodingFormat,
			fileExtension: entry?.fileExtension,
			metadata: entry?.metadata,
			blob: Is.uint8Array(blob) ? Converter.bytesToBase64(blob) : undefined
		};

		return jsonLd;
	}
}
