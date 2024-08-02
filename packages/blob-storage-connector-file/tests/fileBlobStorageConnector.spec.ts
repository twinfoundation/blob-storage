// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { rm } from "node:fs/promises";
import { Converter, I18n, RandomHelper } from "@gtsc/core";
import { MemoryEntityStorageConnector } from "@gtsc/entity-storage-connector-memory";
import { EntityStorageConnectorFactory } from "@gtsc/entity-storage-models";
import {
	EntityStorageLoggingConnector,
	type LogEntry,
	initSchema
} from "@gtsc/logging-connector-entity-storage";
import { LoggingConnectorFactory } from "@gtsc/logging-models";
import { nameof } from "@gtsc/nameof";
import { FileBlobStorageConnector } from "../src/fileBlobStorageConnector";
import type { IFileBlobStorageConnectorConfig } from "../src/models/IFileBlobStorageConnectorConfig";

let memoryEntityStorage: MemoryEntityStorageConnector<LogEntry>;

const TEST_DIRECTORY_ROOT = "./.tmp/";
const TEST_DIRECTORY = `${TEST_DIRECTORY_ROOT}test-data-${Converter.bytesToHex(RandomHelper.generate(8))}`;

describe("FileBlobStorageConnector", () => {
	beforeAll(async () => {
		I18n.addDictionary("en", await import("../locales/en.json"));

		initSchema();
	});

	beforeEach(() => {
		memoryEntityStorage = new MemoryEntityStorageConnector<LogEntry>({
			entitySchema: nameof<LogEntry>()
		});
		EntityStorageConnectorFactory.register("log-entry", () => memoryEntityStorage);
		LoggingConnectorFactory.register("logging", () => new EntityStorageLoggingConnector());
		LoggingConnectorFactory.register("system-logging", () => new EntityStorageLoggingConnector());
	});

	afterAll(async () => {
		try {
			await rm(TEST_DIRECTORY_ROOT, { recursive: true });
		} catch {}
	});

	test("can fail to construct when there is no options", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					undefined as unknown as {
						config: IFileBlobStorageConnectorConfig;
					}
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "options",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct when there is no config", async () => {
		expect(
			() =>
				new FileBlobStorageConnector(
					{} as unknown as {
						config: IFileBlobStorageConnectorConfig;
					}
				)
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.objectUndefined",
				properties: {
					property: "options.config",
					value: "undefined"
				}
			})
		);
	});

	test("can fail to construct when there is no config directory", async () => {
		expect(
			() =>
				new FileBlobStorageConnector({ config: {} } as unknown as {
					config: IFileBlobStorageConnectorConfig;
				})
		).toThrow(
			expect.objectContaining({
				name: "GuardError",
				message: "guard.string",
				properties: {
					property: "options.config.directory",
					value: "undefined"
				}
			})
		);
	});

	test("can construct", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		expect(blobStorage).toBeDefined();
	});

	test("can fail to bootstrap with invalid directory", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: "|\0"
			}
		});
		await blobStorage.bootstrap();
		const logs = memoryEntityStorage.getStore();
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(2);
		expect(logs?.[0].message).toEqual("directoryCreating");
		expect(logs?.[1].message).toEqual("directoryCreateFailed");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreating")).toEqual(true);
		expect(I18n.hasMessage("error.fileBlobStorageConnector.directoryCreateFailed")).toEqual(true);
	});

	test("can bootstrap and create directory", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		await blobStorage.bootstrap();
		const logs = memoryEntityStorage.getStore();
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(2);
		expect(logs?.[0].message).toEqual("directoryCreating");
		expect(logs?.[1].message).toEqual("directoryCreated");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreating")).toEqual(true);
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryCreated")).toEqual(true);
	});

	test("can bootstrap and skip existing directory", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		await blobStorage.bootstrap();
		const logs = memoryEntityStorage.getStore();
		expect(logs).toBeDefined();
		expect(logs?.length).toEqual(1);
		expect(logs?.[0].message).toEqual("directoryExists");
		expect(I18n.hasMessage("info.fileBlobStorageConnector.directoryExists")).toEqual(true);
	});

	test("can fail to set an item with no blob", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		await expect(blobStorage.set(undefined as unknown as Uint8Array)).rejects.toMatchObject({
			name: "GuardError",
			message: "guard.uint8Array",
			properties: {
				property: "blob",
				value: "undefined"
			}
		});
	});

	test("can fail to set an item when write operation fails", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		});

		await expect(blobStorage.set(new Uint8Array([1, 2, 3]))).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.setBlobFailed"
		});

		expect(I18n.hasMessage("error.fileBlobStorageConnector.setBlobFailed")).toEqual(true);
	});

	test("can set an item", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		const idUrn = await blobStorage.set(new Uint8Array([1, 2, 3]));

		const item = await blobStorage.get(idUrn);

		expect(item).toBeDefined();
		expect(item?.length).toEqual(3);
		expect(item?.[0]).toEqual(1);
		expect(item?.[1]).toEqual(2);
		expect(item?.[2]).toEqual(3);
	});

	test("can fail to get an item with no id", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
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
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		await expect(blobStorage.get("urn:foo:1234")).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: FileBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can fail to get an item with read failure", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		});
		await expect(
			blobStorage.get(`urn:blob:${FileBlobStorageConnector.NAMESPACE}:1234`)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.getBlobFailed"
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.getBlobFailed")).toEqual(true);
	});

	test("can not get an item", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		const idUrn = await blobStorage.set(new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get(`${idUrn}-2`);

		expect(item).toBeUndefined();
	});

	test("can get an item", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		const idUrn = await blobStorage.set(new Uint8Array([1, 2, 3]));
		const item = await blobStorage.get(idUrn);

		expect(item).toBeDefined();
		expect(item?.length).toEqual(3);
		expect(item?.[0]).toEqual(1);
		expect(item?.[1]).toEqual(2);
		expect(item?.[2]).toEqual(3);
	});

	test("can fail to remove an item with no id", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
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
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		await expect(blobStorage.remove("urn:foo:1234")).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.namespaceMismatch",
			properties: {
				namespace: FileBlobStorageConnector.NAMESPACE
			}
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.namespaceMismatch")).toEqual(true);
	});

	test("can fail to remove an item with storage failure", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY,
				extension: "\0"
			}
		});
		await expect(
			blobStorage.remove(`urn:blob:${FileBlobStorageConnector.NAMESPACE}:1234`)
		).rejects.toMatchObject({
			name: "GeneralError",
			message: "fileBlobStorageConnector.removeBlobFailed"
		});
		expect(I18n.hasMessage("error.fileBlobStorageConnector.removeBlobFailed")).toEqual(true);
	});

	test("can not remove an item", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		const idUrn = await blobStorage.set(new Uint8Array([1, 2, 3]));

		await blobStorage.remove(`${idUrn}-2`);

		const item = await blobStorage.get(idUrn);

		expect(item).toBeDefined();
	});

	test("can remove an item", async () => {
		const blobStorage = new FileBlobStorageConnector({
			config: {
				directory: TEST_DIRECTORY
			}
		});
		const idUrn = await blobStorage.set(new Uint8Array([1, 2, 3]));
		await blobStorage.remove(idUrn);
		const item = await blobStorage.get(idUrn);

		expect(item).toBeUndefined();
	});
});
