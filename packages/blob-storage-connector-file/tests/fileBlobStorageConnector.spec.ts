// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { rm } from "node:fs/promises";
import { Converter, I18n, RandomHelper } from "@gtsc/core";
import { EntitySchemaHelper } from "@gtsc/entity";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { LogEntry, EntityStorageLoggingConnector } from "@gtsc/logging-connector-entity-storage";
import type { ILogging } from "@gtsc/logging-models";
import { LoggingService } from "@gtsc/logging-service";
import { FileBlobStorageConnector } from "../src/fileBlobStorageConnector";
import type { IFileBlobStorageConnectorConfig } from "../src/models/IFileBlobStorageConnectorConfig";

const logEntrySchema = EntitySchemaHelper.getSchema(LogEntry);
let memoryEntityStorageStorage: MemoryEntityStorageConnector<LogEntry>;
let testLogging: ILogging;

const TEST_DIRECTORY_ROOT = "./.tmp/";
const TEST_DIRECTORY = `${TEST_DIRECTORY_ROOT}test-data-${Converter.bytesToHex(RandomHelper.generate(8))}`;
const TEST_TENANT_ID = "test-tenant";

describe("FileBlobStorageConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));
	});

	beforeEach(() => {
		memoryEntityStorageStorage = new MemoryEntityStorageConnector<LogEntry>(logEntrySchema);
		const blobStorageLoggingConnector = new EntityStorageLoggingConnector({
			logEntryStorage: memoryEntityStorageStorage
		});
		testLogging = new LoggingService({
			loggingConnector: blobStorageLoggingConnector
		});
	});

	afterAll(async () => {
		try {
			await rm(TEST_DIRECTORY_ROOT, { recursive: true });
		} catch {}
	});

	test("can fail to construct when there is no dependencies", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					undefined as unknown as { logging: ILogging },
					undefined as unknown as IFileBlobStorageConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct when there is no logging", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					{} as unknown as { logging: ILogging },
					undefined as unknown as IFileBlobStorageConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "dependencies.logging",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct when there is no config", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					{ logging: testLogging },
					undefined as unknown as IFileBlobStorageConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "config",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct when there is no config directory", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					{ logging: testLogging },
					{} as unknown as IFileBlobStorageConnectorConfig
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "config.directory",
					value: "undefined"
				}
			})
		);
	});

	test("can construct", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		expect(blobStorage).toBeDefined();
	});

	test("can fail to bootstrap with invalid directory", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: "|\0"
			}
		);
		await blobStorage.bootstrap({ tenantId: TEST_TENANT_ID });
		const logs = memoryEntityStorageStorage.getStore(TEST_TENANT_ID);
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(2);
		expect(logs?.[0].message).toEqual("directoryCreating");
		expect(logs?.[1].message).toEqual("directoryCreateFailed");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreating")).toEqual(true);
		expect(I18n.hasMessage("error.fileBlobStorageConnector.directoryCreateFailed")).toEqual(true);
	});

	test("can bootstrap and create directory", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		await blobStorage.bootstrap({ tenantId: TEST_TENANT_ID });
		const logs = memoryEntityStorageStorage.getStore(TEST_TENANT_ID);
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(2);
		expect(logs?.[0].message).toEqual("directoryCreating");
		expect(logs?.[1].message).toEqual("directoryCreated");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreating")).toEqual(true);
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreated")).toEqual(true);
	});

	test("can bootstrap and skip existing directory", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		await blobStorage.bootstrap({ tenantId: TEST_TENANT_ID });
		const logs = memoryEntityStorageStorage.getStore(TEST_TENANT_ID);
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(1);
		expect(logs?.[0].message).toEqual("directoryExists");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryExists")).toEqual(true);
	});

	test("can fail to set an item with no tenant id", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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

	test("can fail to set an item when write operation fails", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		);

		await expect(
			blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]))
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.setBlobFailed"
		});

		expect(I18n.hasMessage("error.fileBlobStorageConnector.setBlobFailed")).toEqual(true);
	});

	test("can set an item", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{ directory: TEST_DIRECTORY }
		);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));

		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeDefined();
		expect(item?.length).toEqual(3);
		expect(item?.[0]).toEqual(1);
		expect(item?.[1]).toEqual(2);
		expect(item?.[2]).toEqual(3);
	});

	test("can fail to get an item with no tenant id", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		await expect(
			blobStorage.get({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: FileBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can fail to get an item with read failure", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		);
		await expect(
			blobStorage.get(
				{ tenantId: TEST_TENANT_ID },
				`urn:${FileBlobStorageConnector.NAMESPACE}:1234`
			)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.getBlobFailed"
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.getBlobFailed")).toEqual(true);
	});

	test("can not get an item", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);

		expect(item).toBeUndefined();
	});

	test("can get an item", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },

			{
				directory: TEST_DIRECTORY
			}
		);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeDefined();
		expect(item?.length).toEqual(3);
		expect(item?.[0]).toEqual(1);
		expect(item?.[1]).toEqual(2);
		expect(item?.[2]).toEqual(3);
	});

	test("can fail to remove an item with no tenant id", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
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
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		await expect(
			blobStorage.remove({ tenantId: TEST_TENANT_ID }, "urn:foo:1234")
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: FileBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can fail to remove an item with storage failure", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		);
		await expect(
			blobStorage.remove(
				{ tenantId: TEST_TENANT_ID },
				`urn:${FileBlobStorageConnector.NAMESPACE}:1234`
			)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.removeBlobFailed"
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.removeBlobFailed")).toEqual(true);
	});

	test("can not remove an item", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));

		await blobStorage.remove({ tenantId: TEST_TENANT_ID }, `${idUrn}-2`);

		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeDefined();
	});

	test("can remove an item", async () => {
		const blobStorage = new FileBlobStorageConnector(
			{ logging: testLogging },
			{
				directory: TEST_DIRECTORY
			}
		);
		const idUrn = await blobStorage.set({ tenantId: TEST_TENANT_ID }, new Uint8Array([1, 2, 3]));
		await blobStorage.remove({ tenantId: TEST_TENANT_ID }, idUrn);
		const item = await blobStorage.get({ tenantId: TEST_TENANT_ID }, idUrn);

		expect(item).toBeUndefined();
	});
});
