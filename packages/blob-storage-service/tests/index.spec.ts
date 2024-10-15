// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { MemoryBlobStorageConnector } from "@twin.org/blob-storage-connector-memory";
import { BlobStorageConnectorFactory } from "@twin.org/blob-storage-models";
import { Converter } from "@twin.org/core";
import { EntitySchemaFactory, EntitySchemaHelper } from "@twin.org/entity";
import { MemoryEntityStorageConnector } from "@twin.org/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@twin.org/entity-storage-models";
import { nameof } from "@twin.org/nameof";
import { BlobStorageService } from "../src/blobStorageService";
import { BlobMetadata } from "../src/entities/blobMetadata";

const TEST_USER_IDENTITY = "test-user-identity";
const TEST_NODE_IDENTITY = "test-node-identity";
let entityStorage: MemoryEntityStorageConnector<BlobMetadata>;
let blobStorage: MemoryBlobStorageConnector;

describe("blob-storage-service", () => {
	beforeEach(() => {
		EntitySchemaFactory.register(nameof<BlobMetadata>(), () =>
			EntitySchemaHelper.getSchema(BlobMetadata)
		);

		entityStorage = new MemoryEntityStorageConnector<BlobMetadata>({
			entitySchema: nameof<BlobMetadata>()
		});

		EntityStorageConnectorFactory.register("blob-metadata", () => entityStorage);

		blobStorage = new MemoryBlobStorageConnector();
		BlobStorageConnectorFactory.register("memory", () => blobStorage);
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
				extension: "txt",
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				mimeType: "text/plain"
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
				extension: "txt",
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				mimeType: "text/plain",
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
				extension: "txt",
				id: "blob:memory:d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
				mimeType: "text/plain",
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

		const result = await service.get(id, true);
		expect(result).toEqual({
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			extension: "txt",
			mimeType: "text/plain"
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

		const result = await service.get(id, true, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);
		expect(result).toEqual({
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			extension: "txt",
			mimeType: "text/plain"
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

		const result = await service.get(id, true, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);
		expect(result).toEqual({
			blob: "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZw==",
			extension: "txt",
			mimeType: "text/plain",
			metadata: {
				"@context": "https://schema.org",
				"@type": "CreativeWork",
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
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test"
			},
			undefined,
			TEST_USER_IDENTITY,
			TEST_NODE_IDENTITY
		);

		const result = await service.get(id, false, TEST_USER_IDENTITY, TEST_NODE_IDENTITY);
		expect(result).toEqual({
			blob: undefined,
			extension: "txt",
			mimeType: "text/plain",
			metadata: {
				"@context": "https://schema.org",
				"@type": "CreativeWork",
				name: "Test"
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
				extension: "txt",
				mimeType: "text/plain",
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
				extension: "txt",
				mimeType: "text/plain",
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
});
