// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { I18n, RandomHelper, Urn } from "@gtsc/core";
import { TEST_IPFS_CONFIG, TEST_IPFS_PUBLIC_GATEWAY } from "./setupTestEnv";
import { IpfsBlobStorageConnector } from "../src/ipfsBlobStorageConnector";

const TEST_TENANT_ID = "test-tenant";

const TEST_DATA = RandomHelper.generate(32);

describe("IpfsBlobStorageConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
	});

	test("can construct", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		expect(blobStorage).toBeDefined();
	});

	test("can fail to set an item with no tenant id", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);

		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, TEST_DATA);

		expect(idUrn).toBeDefined();

		const urn = Urn.fromValidString(idUrn);
		process.stdout.write(`${TEST_IPFS_PUBLIC_GATEWAY.replace(":hash", urn.namespaceSpecific())}\n`);
	});

	test("can fail to get an item with no tenant id", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		await expect(
			blobStorage.get({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "ipfsBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: IpfsBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.ipfsBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can not get an item", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, TEST_DATA);
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);

		expect(item).toBeUndefined();
	});

	test("can get an item", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, TEST_DATA);
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeDefined();
		expect(item).toEqual(TEST_DATA);
	});

	test("can fail to remove an item with no tenant id", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
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
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		await expect(
			blobStorage.remove({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "ipfsBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: IpfsBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.ipfsBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can not remove an item", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, TEST_DATA);

		const removed = await blobStorage.remove({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);
		expect(removed).toBe(false);
	});

	test("can remove an item", async () => {
		const blobStorage = new IpfsBlobStorageConnector(TEST_IPFS_CONFIG);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, TEST_DATA);
		const removed = await blobStorage.remove({ tenantId: TEST_TENANT_ID }, idUrn);
		expect(removed).toBe(true);
	});
});
