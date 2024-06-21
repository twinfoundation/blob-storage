// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { I18n, Urn } from "@gtsc/core";
import { MemoryBlobStorageConnector } from "../src/memoryBlobStorageConnector";

const TEST_TENANT_ID = "test-tenant";

describe("MemoryBlobStorageConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
	});

	test("can construct", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		expect(blobStorage).toBeDefined();
	});

	test("can fail to set an item with no tenant id", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(blobStorage.set({}, undefined as unknown as Uint8Array)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to set an item with no blob", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(
			blobStorage.set({ tenantId: TEST_TENANT_ID }, undefined as unknown as Uint8Array)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "blob",
				value: "undefined"
			}
		});
	});

	test("can set an item", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		expect(idUrn).toBeDefined();

		const urn = Urn.fromValidString(idUrn);
		const id = urn.namespaceSpecific();
		const store = blobStorage.getStore(TEST_TENANT_ID);
		expect(store).toBeDefined();
		expect(store?.[id]).toBeDefined();
		expect(store?.[id]?.length).toEqual(3);
		expect(store?.[id]?.[0]).toEqual(1);
		expect(store?.[id]?.[1]).toEqual(2);
		expect(store?.[id]?.[2]).toEqual(3);
	});

	test("can fail to get an item with no tenant id", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(blobStorage.get({}, undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item with no id", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(
			blobStorage.get({ tenantId: TEST_TENANT_ID }, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item with mismatched urn namespace", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(
			blobStorage.get({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "memoryBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: MemoryBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.memoryBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can not get an item", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);

		expect(item).toBeUndefined();
	});

	test("can get an item", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeDefined();
		expect(item?.length).toEqual(3);
		expect(item?.[0]).toEqual(1);
		expect(item?.[1]).toEqual(2);
		expect(item?.[2]).toEqual(3);
	});

	test("can fail to remove an item with no tenant id", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(blobStorage.remove({}, undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "requestContext.tenantId",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item with no id", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(
			blobStorage.remove({ tenantId: TEST_TENANT_ID }, undefined as unknown as string)
		).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item with mismatched urn namespace", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		await expect(
			blobStorage.remove({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "memoryBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: MemoryBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.memoryBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can not remove an item", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const urn = Urn.fromValidString(idUrn);
		const id = urn.namespaceSpecific();

		await blobStorage.remove({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);

		const store = blobStorage.getStore(TEST_TENANT_ID);
		expect(store).toBeDefined();
		expect(store?.[id]).toBeDefined();
	});

	test("can remove an item", async () => {
		const blobStorage = new MemoryBlobStorageConnector();
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const urn = Urn.fromValidString(idUrn);
		const id = urn.namespaceSpecific();

		await blobStorage.remove({ tenantId: TEST_TENANT_ID }, idUrn);

		const store = blobStorage.getStore(TEST_TENANT_ID);
		expect(store).toBeDefined();
		expect(store?.[id]).toBeUndefined();
	});
});
