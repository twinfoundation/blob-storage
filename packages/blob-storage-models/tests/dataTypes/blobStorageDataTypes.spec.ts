// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { BlobStorageDataTypes } from "../../src/dataTypes/blobStorageDataTypes";
import { BlobStorageTypes } from "../../src/models/blobStorageTypes";

describe("BlobStorageDataTypes", () => {
	beforeAll(async () => {
		JsonLdDataTypes.registerTypes();
		BlobStorageDataTypes.registerTypes();
	});

	test("Can fail to validate an empty entry", async () => {
		const validationFailures: IValidationFailure[] = [];
		const isValid = await DataTypeHelper.validate(
			"",
			BlobStorageTypes.Entry,
			{},
			validationFailures
		);
		expect(validationFailures.length).toEqual(1);
		expect(isValid).toEqual(false);
	});

	test("Can validate an empty entry", async () => {
		const validationFailures: IValidationFailure[] = [];
		const isValid = await DataTypeHelper.validate(
			"",
			BlobStorageTypes.Entry,
			{
				"@context": [BlobStorageTypes.ContextRoot, BlobStorageTypes.ContextRootCommon],
				type: BlobStorageTypes.Entry,
				dateCreated: new Date().toISOString(),
				id: "1111",
				blobSize: 100,
				blobHash: "abc"
			},
			validationFailures
		);
		expect(validationFailures.length).toEqual(0);
		expect(isValid).toEqual(true);
	});
});
