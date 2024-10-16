# Interface: IBlobStorageComponent

Interface describing an blob storage component.

## Extends

- `IComponent`

## Methods

### create()

> **create**(`blob`, `mimeType`?, `extension`?, `metadata`?, `namespace`?, `userIdentity`?, `nodeIdentity`?): `Promise`\<`string`\>

Create the blob with some metadata.

#### Parameters

• **blob**: `string`

The data for the blob in base64 format.

• **mimeType?**: `string`

Mime type for the blob, will be detected if left undefined.

• **extension?**: `string`

Extension for the blob, will be detected if left undefined.

• **metadata?**: `IJsonLdNodeObject`

Data for the custom metadata as JSON-LD.

• **namespace?**: `string`

The namespace to use for storing, defaults to component configured namespace.

• **userIdentity?**: `string`

The user identity to use with storage operations.

• **nodeIdentity?**: `string`

The node identity to use with storage operations.

#### Returns

`Promise`\<`string`\>

The id of the stored blob in urn format.

***

### get()

> **get**(`id`, `includeContent`, `userIdentity`?, `nodeIdentity`?): `Promise`\<`object`\>

Get the blob and metadata.

#### Parameters

• **id**: `string`

The id of the blob to get in urn format.

• **includeContent**: `boolean`

Include the content, or just get the metadata.

• **userIdentity?**: `string`

The user identity to use with storage operations.

• **nodeIdentity?**: `string`

The node identity to use with storage operations.

#### Returns

`Promise`\<`object`\>

The data and metadata for the blob if it can be found.

##### blob?

> `optional` **blob**: `string`

##### mimeType?

> `optional` **mimeType**: `string`

##### extension?

> `optional` **extension**: `string`

##### metadata?

> `optional` **metadata**: `IJsonLdNodeObject`

#### Throws

Not found error if the blob cannot be found.

***

### update()

> **update**(`id`, `mimeType`?, `extension`?, `metadata`?, `userIdentity`?, `nodeIdentity`?): `Promise`\<`void`\>

Update the blob with metadata.

#### Parameters

• **id**: `string`

The id of the blob metadata to update.

• **mimeType?**: `string`

Mime type for the blob, will be detected if left undefined.

• **extension?**: `string`

Extension for the blob, will be detected if left undefined.

• **metadata?**: `IJsonLdNodeObject`

Data for the custom metadata as JSON-LD.

• **userIdentity?**: `string`

The user identity to use with storage operations.

• **nodeIdentity?**: `string`

The node identity to use with storage operations.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Not found error if the blob cannot be found.

***

### remove()

> **remove**(`id`, `userIdentity`?, `nodeIdentity`?): `Promise`\<`void`\>

Remove the blob.

#### Parameters

• **id**: `string`

The id of the blob to remove in urn format.

• **userIdentity?**: `string`

The user identity to use with storage operations.

• **nodeIdentity?**: `string`

The node identity to use with storage operations.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Not found error if the blob cannot be found.

***

### query()

> **query**(`conditions`?, `sortProperties`?, `cursor`?, `pageSize`?, `userIdentity`?, `nodeIdentity`?): `Promise`\<`object`\>

Query all the blob storage entries which match the conditions.

#### Parameters

• **conditions?**: `EntityCondition`\<[`IBlobStorageEntry`](IBlobStorageEntry.md)\>

The conditions to match for the entries.

• **sortProperties?**: `object`[]

The optional sort order.

• **cursor?**: `string`

The cursor to request the next page of entries.

• **pageSize?**: `number`

The suggested number of entries to return in each chunk, in some scenarios can return a different amount.

• **userIdentity?**: `string`

The user identity to use with storage operations.

• **nodeIdentity?**: `string`

The node identity to use with storage operations.

#### Returns

`Promise`\<`object`\>

All the entries for the storage matching the conditions,
and a cursor which can be used to request more entities.

##### entities

> **entities**: [`IBlobStorageEntry`](IBlobStorageEntry.md)[]

The entities.

##### cursor?

> `optional` **cursor**: `string`

An optional cursor, when defined can be used to call find to get more entities.
