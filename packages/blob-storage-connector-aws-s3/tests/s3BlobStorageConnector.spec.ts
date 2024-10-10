// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { I18n, RandomHelper } from "@twin.org/core";
import { createTestBucket, TEST_S3_CONFIG } from "./setupTestEnv";
import { S3BlobStorageConnector } from "../src/s3BlobStorageConnector";

const TEST_DATA = RandomHelper.generate(32);
const TEST_DATA_2 = RandomHelper.generate(32);

describe("S3BlobStorageConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
		await createTestBucket();
	});

	test("can construct", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		expect(blobStorage).toBeDefined();
	});

	test("can fail to set an item with no blob", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		await expect(blobStorage.set(undefined as unknown as Uint8Array)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "blob",
				value: "undefined"
			}
		});
	});

	test("can set an item", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });

		const idUrn = await blobStorage.set(TEST_DATA);

		expect(idUrn).toBeDefined();
	});

	test("can fail to get an item with no id", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		await expect(blobStorage.get(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to get an item with mismatched urn namespace", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		await expect(blobStorage.get("urn:foo:1234")).rejects.toMatchObject({
			name: "GeneralError",
			message: "s3BlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: S3BlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.s3BlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can not get an item", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		const idUrn = await blobStorage.set(TEST_DATA);
		const item = await blobStorage.get(`${idUrn}-2`);

		expect(item).toBeUndefined();
	});

	test("can get an item", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		const idUrn = await blobStorage.set(TEST_DATA);
		const item = await blobStorage.get(idUrn);

		expect(item).toBeDefined();
		expect(item).toEqual(TEST_DATA);
	});

	test("can fail to remove an item with no id", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		await expect(blobStorage.remove(undefined as unknown as string)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.string",
			properties: {
				property: "id",
				value: "undefined"
			}
		});
	});

	test("can fail to remove an item with mismatched urn namespace", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		await expect(blobStorage.remove("urn:foo:1234")).rejects.toMatchObject({
			name: "GeneralError",
			message: "s3BlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: S3BlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.s3BlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can remove an item", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		const idUrn = await blobStorage.set(TEST_DATA);
		const removed = await blobStorage.remove(idUrn);
		expect(removed).toBe(true);
	});

	test("can not remove an item", async () => {
		const blobStorage = new S3BlobStorageConnector({ config: TEST_S3_CONFIG });
		const idUrn = await blobStorage.set(TEST_DATA_2);

		const removed = await blobStorage.remove(`${idUrn}-2`);
		expect(removed).toBe(false);
	});
});
