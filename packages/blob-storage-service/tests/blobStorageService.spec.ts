// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryBlobStorageConnector } from "@twin.org/blob-storage-connector-memory";
import {
	BlobStorageCompressionType,
	BlobStorageConnectorFactory
} from "@twin.org/blob-storage-models";
import { Converter } from "@twin.org/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import {
	EntityStorageVaultConnector,
	type VaultKey,
	type VaultSecret,
	initSchema as initSchemaVault
} from "@twin.org/vault-connector-entity-storage";
import { VaultConnectorFactory, VaultKeyType } from "@twin.org/vault-models";
import { BlobStorageService } from "../src/blobStorageService";
import { BlobStorageEntry } from "../src/entities/blobStorageEntry";

const TEST_USER_IDENTITY = "test-user-identity";
const TEST_NODE_IDENTITY = "test-node-identity";
let entityStorage: MemoryEntityStorageConnector<BlobStorageEntry>;
let blobStorage: MemoryBlobStorageConnector;

describe("blob-storage-service", () => {
	beforeEach(() => {
		EntitySchemaFactory.register(nameof<BlobStorageEntry>(), () =>
			EntitySchemaHelper.getSchema(BlobStorageEntry)
		);

		entityStorage = new MemoryEntityStorageConnector<BlobStorageEntry>({
			entitySchema: nameof<BlobStorageEntry>()
		});

		EntityStorageConnectorFactory.register("blob-storage-entry", () => entityStorage);

		blobStorage = new MemoryBlobStorageConnector();
		BlobStorageConnectorFactory.register("memory", () => blobStorage);

		Date.now = vi
			.fn()
			.mockImplementationOnce(() => 1724327716271)
			.mockImplementation(() => 1724327816272);

		initSchemaVault();
	});

	test("can create the service", async () => {
		const service = new BlobStorageService();
		expect(service).toBeDefined();
	});

	test("can add a file with no metadata", async () => {
		const service = new BlobStorageService({
			config: { includeNodeIdentity: false, includeUserIdentity: false }
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		await service.create(data);
		expect(entityStorage.getStore()).toEqual([
			{
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:55:16.271Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: false
			}
		]);
		expect(blobStorage.getStore()).toEqual({
			d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592: dataBytes
		});
	});

	test("can add a file with no metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		await service.create(
			data,
			undefined,
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:55:16.271Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: false,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity"
			}
		]);
		expect(blobStorage.getStore()).toEqual({
			d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592: dataBytes
		});
	});

	test("can add a file with metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		await service.create(
			data,
			undefined,
			undefined,
			{
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test"
			},
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:56:56.272Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: false,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity",
				metadata: {
					"@context": "https://schema.org",
					"@type": "CreativeWork",
					name: "Test"
				}
			}
		]);
		expect(blobStorage.getStore()).toEqual({
			d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592: dataBytes
		});
	});

	test("can get a file with no metadata", async () => {
		const service = new BlobStorageService({
			config: { includeNodeIdentity: false, includeUserIdentity: false }
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(data);

		const result = await service.get(id, { includeContent: true });
		expect(result).toEqual({
			"@context": [
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/common/",
				"https://schema.org"
			],
			type: "BlobStorageEntry",
			id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
			blobSize: 43,
			blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
			dateCreated: "2024-08-22T11:55:16.271Z",
			fileExtension: "txt",
			encodingFormat: "text/plain",
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			isEncrypted: false
		});
	});

	test("can get a file with no metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const result = await service.get(
			id,
			{ includeContent: true },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(result).toEqual({
			"@context": [
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/common/",
				"https://schema.org"
			],
			type: "BlobStorageEntry",
			id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
			fileExtension: "txt",
			dateCreated: "2024-08-22T11:55:16.271Z",
			encodingFormat: "text/plain",
			blobSize: 43,
			blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			isEncrypted: false
		});
	});

	test("can get a file with metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(
			data,
			undefined,
			undefined,
			{
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test"
			},
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const result = await service.get(
			id,
			{ includeContent: true },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(result).toEqual({
			"@context": [
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/common/",
				"https://schema.org"
			],
			type: "BlobStorageEntry",
			id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
			fileExtension: "txt",
			dateCreated: "2024-08-22T11:56:56.272Z",
			encodingFormat: "text/plain",
			blobSize: 43,
			blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			isEncrypted: false,
			metadata: {
				type: "CreativeWork",
				name: "Test"
			}
		});
	});

	test("can get a file metadata only with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(
			data,
			undefined,
			undefined,
			{
				"@context": "https://www.w3.org/ns/activitystreams",
				type: "Create",
				actor: {
					type: "Person",
					id: "acct:person@example.org",
					name: "Person"
				},
				object: {
					type: "Note",
					content: "This is a simple note"
				},
				published: "2015-01-25T12:34:56Z"
			},
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const result = await service.get(id, undefined, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);
		expect(result).toEqual({
			"@context": [
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/common/",
				"https://schema.org",
				"https://www.w3.org/ns/activitystreams"
			],
			type: "BlobStorageEntry",
			id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
			fileExtension: "txt",
			dateCreated: "2024-08-22T11:56:56.272Z",
			encodingFormat: "text/plain",
			blobSize: 43,
			blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
			isEncrypted: false,
			metadata: {
				type: "Create",
				actor: {
					type: "Person",
					id: "acct:person@example.org",
					name: "Person"
				},
				object: {
					type: "Note",
					content: "This is a simple note"
				},
				published: "2015-01-25T12:34:56Z"
			}
		});
	});

	test("can update a file with metadata", async () => {
		const service = new BlobStorageService({
			config: { includeNodeIdentity: false, includeUserIdentity: false }
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(data);

		await service.update(id, undefined, undefined, {
			"@context": "https://schema.org",
			"@type": "CreativeWork",
			name: "Test2"
		});
		expect(entityStorage.getStore()).toEqual([
			{
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				fileExtension: "txt",
				dateCreated: "2024-08-22T11:55:16.271Z",
				dateModified: "2024-08-22T11:56:56.272Z",
				encodingFormat: "text/plain",
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				isEncrypted: false,
				metadata: {
					"@context": "https://schema.org",
					"@type": "CreativeWork",
					name: "Test2"
				}
			}
		]);
	});

	test("can update a file with metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		await service.update(
			id,
			undefined,
			undefined,
			{
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test2"
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				fileExtension: "txt",
				dateCreated: "2024-08-22T11:55:16.271Z",
				dateModified: "2024-08-22T11:56:56.272Z",
				encodingFormat: "text/plain",
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				isEncrypted: false,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity",
				metadata: {
					"@context": "https://schema.org",
					"@type": "CreativeWork",
					name: "Test2"
				}
			}
		]);
	});

	test("can remove a file with metadata", async () => {
		const service = new BlobStorageService({
			config: { includeNodeIdentity: false, includeUserIdentity: false }
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(data, undefined, undefined, {
			"@context": "https://schema.org",
			"@type": "CreativeWork",
			name: "Test2"
		});

		await service.remove(id);
		expect(entityStorage.getStore()).toEqual([]);
		expect(blobStorage.getStore()).toEqual({});
	});

	test("can remove a file with metadata with userIdentity and nodeIdentity", async () => {
		const service = new BlobStorageService();
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const id = await service.create(
			data,
			undefined,
			undefined,
			{
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test2"
			},
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		await service.remove(id, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);
		expect(entityStorage.getStore()).toEqual([]);
		expect(blobStorage.getStore()).toEqual({});
	});

	test("can query the entries", async () => {
		const service = new BlobStorageService({
			config: { includeNodeIdentity: false, includeUserIdentity: false }
		});

		for (let i = 0; i < 3; i++) {
			const dataBytes = Converter.utf8ToBytes(`The quick brown fox jumps over the lazy dog${i}`);
			const data = Converter.bytesToBase64(dataBytes);
			await service.create(data, undefined, undefined, {
				"@context": "https://www.w3.org/ns/activitystreams",
				type: "Create",
				actor: {
					type: `Person${i}`,
					id: "acct:person@example.org",
					name: "Person"
				},
				object: {
					type: "Note",
					content: "This is a simple note"
				},
				published: "2015-01-25T12:34:56Z"
			});
		}

		expect(entityStorage.getStore().length).toEqual(3);
		expect(Object.keys(blobStorage.getStore()).length).toEqual(3);

		const entries = await service.query();

		expect(entries).toEqual({
			"@context": [
				"https://schema.org",
				"https://schema.twindev.org/blob-storage/",
				"https://schema.twindev.org/common/",
				"https://www.w3.org/ns/activitystreams"
			],
			type: "ItemList",
			itemListElement: [
				{
					id: "blob:memory:29047d3b56d7e6f3cdaed85ffd549d86badf7241d245aa66102f556b0e0e0946",
					type: "BlobStorageEntry",
					dateCreated: "2024-08-22T11:56:56.272Z",
					encodingFormat: "text/plain",
					blobSize: 44,
					blobHash: "sha256:KQR9O1bX5vPNrthf/VSdhrrfckHSRapmEC9Vaw4OCUY=",
					fileExtension: "txt",
					isEncrypted: false,
					metadata: {
						type: "Create",
						actor: {
							type: "Person0",
							id: "acct:person@example.org",
							name: "Person"
						},
						object: {
							type: "Note",
							content: "This is a simple note"
						},
						published: "2015-01-25T12:34:56Z"
					}
				},
				{
					id: "blob:memory:35bbc692cc25c4ed8417eb2a78eba260ea6b166830a8c1e236a1131dd041c632",
					type: "BlobStorageEntry",
					dateCreated: "2024-08-22T11:56:56.272Z",
					encodingFormat: "text/plain",
					blobSize: 44,
					blobHash: "sha256:NbvGkswlxO2EF+sqeOuiYOprFmgwqMHiNqETHdBBxjI=",
					fileExtension: "txt",
					isEncrypted: false,
					metadata: {
						type: "Create",
						actor: {
							type: "Person1",
							id: "acct:person@example.org",
							name: "Person"
						},
						object: {
							type: "Note",
							content: "This is a simple note"
						},
						published: "2015-01-25T12:34:56Z"
					}
				},
				{
					id: "blob:memory:199998607d2fe64c9e6cac5522ba5f62ea87e0608221411cfc2b4994de4fef63",
					type: "BlobStorageEntry",
					dateCreated: "2024-08-22T11:56:56.272Z",
					encodingFormat: "text/plain",
					blobSize: 44,
					blobHash: "sha256:GZmYYH0v5kyebKxVIrpfYuqH4GCCIUEc/CtJlN5P72M=",
					fileExtension: "txt",
					isEncrypted: false,
					metadata: {
						type: "Create",
						actor: {
							type: "Person2",
							id: "acct:person@example.org",
							name: "Person"
						},
						object: {
							type: "Note",
							content: "This is a simple note"
						},
						published: "2015-01-25T12:34:56Z"
					}
				}
			]
		});
	});

	test("can fail to add a file with encryption when vault is not configured", async () => {
		const service = new BlobStorageService({
			config: { vaultKeyId: "my-key" }
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		await expect(
			service.create(
				data,
				undefined,
				undefined,
				undefined,
				undefined,
				TEST_USER_IDENTITY,
				TEST_NODE_IDENTITY
			)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "blobStorageService.createFailed",
			inner: {
				name: "GeneralError",
				message: "blobStorageService.vaultConnectorNotConfigured"
			}
		});
	});

	test("can add a file with encryption", async () => {
		const vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		});

		const vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof<VaultSecret>()
		});

		EntityStorageConnectorFactory.register("vault-key", () => vaultKeyEntityStorageConnector);
		EntityStorageConnectorFactory.register("vault-secret", () => vaultSecretEntityStorageConnector);

		VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());

		await vaultKeyEntityStorageConnector.set({
			id: `${TEST_NODE_IDENTITY}/my-key`,
			type: VaultKeyType.ChaCha20Poly1305,
			privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag="
		});

		const service = new BlobStorageService({
			config: { vaultKeyId: "my-key" },
			vaultConnectorType: "vault"
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const result = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: result,
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:55:16.271Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: true,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity"
			}
		]);

		const decryptedData = await service.get(
			result,
			{ includeContent: true },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(Converter.base64ToBytes(decryptedData.blob ?? "")).toEqual(
			Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog")
		);
	});

	test("can add a file with encryption with disable option", async () => {
		const vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		});

		const vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof<VaultSecret>()
		});

		EntityStorageConnectorFactory.register("vault-key", () => vaultKeyEntityStorageConnector);
		EntityStorageConnectorFactory.register("vault-secret", () => vaultSecretEntityStorageConnector);

		VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());

		await vaultKeyEntityStorageConnector.set({
			id: `${TEST_NODE_IDENTITY}/my-key`,
			type: VaultKeyType.ChaCha20Poly1305,
			privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag="
		});

		const service = new BlobStorageService({
			config: { vaultKeyId: "my-key" },
			vaultConnectorType: "vault"
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const result = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			{
				disableEncryption: true
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: result,
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:55:16.271Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: false,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity"
			}
		]);

		const decryptedData = await service.get(
			result,
			{ includeContent: true },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(Converter.base64ToBytes(decryptedData.blob ?? "")).toEqual(
			Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog")
		);
	});

	test("can add a file with encryption with override key option", async () => {
		const vaultKeyEntityStorageConnector = new MemoryEntityStorageConnector<VaultKey>({
			entitySchema: nameof<VaultKey>()
		});

		const vaultSecretEntityStorageConnector = new MemoryEntityStorageConnector<VaultSecret>({
			entitySchema: nameof<VaultSecret>()
		});

		EntityStorageConnectorFactory.register("vault-key", () => vaultKeyEntityStorageConnector);
		EntityStorageConnectorFactory.register("vault-secret", () => vaultSecretEntityStorageConnector);

		VaultConnectorFactory.register("vault", () => new EntityStorageVaultConnector());

		await vaultKeyEntityStorageConnector.set({
			id: `${TEST_NODE_IDENTITY}/my-key`,
			type: VaultKeyType.ChaCha20Poly1305,
			privateKey: "vOpvrUcuiDJF09hoe9AWa4OUqcNqr6RpGOuj/A57gag="
		});

		const service = new BlobStorageService({
			config: { vaultKeyId: "my-key-default" },
			vaultConnectorType: "vault"
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const result = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			{
				overrideVaultKeyId: "my-key"
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: result,
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:55:16.271Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: true,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity"
			}
		]);

		const decryptedData = await service.get(
			result,
			{ includeContent: true, overrideVaultKeyId: "my-key" },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(Converter.base64ToBytes(decryptedData.blob ?? "")).toEqual(
			Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog")
		);
	});

	test("can add a file with compression", async () => {
		const service = new BlobStorageService({
			config: {}
		});
		const dataBytes = Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog");
		const data = Converter.bytesToBase64(dataBytes);
		const result = await service.create(
			data,
			undefined,
			undefined,
			undefined,
			{
				compress: BlobStorageCompressionType.Gzip
			},
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(entityStorage.getStore()).toEqual([
			{
				id: result,
				blobSize: 43,
				blobHash: "sha256:16j7swfXgJRpypq8sAguT41WUeRtPNt2LQLQvzfJ5ZI=",
				dateCreated: "2024-08-22T11:56:56.272Z",
				fileExtension: "txt",
				encodingFormat: "text/plain",
				isEncrypted: false,
				compression: BlobStorageCompressionType.Gzip,
				nodeIdentity: "test-node-identity",
				userIdentity: "test-user-identity"
			}
		]);

		const compressedData = await service.get(
			result,
			{ includeContent: true, decompress: false },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		// Should still be compressed
		expect(compressedData.blob ?? "").toEqual(
			"H4sIAAAAAAAAAwvJSFUoLM1MzlZIKsovz1NIy69QyCrNLShWyC9LLVIoyUhVyEmsqlRIyU8HADmjT0ErAAAA"
		);

		const uncompressedData = await service.get(
			result,
			{ includeContent: true },
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);
		expect(Converter.base64ToBytes(uncompressedData.blob ?? "")).toEqual(
			Converter.utf8ToBytes("The quick brown fox jumps over the lazy dog")
		);
	});
});
