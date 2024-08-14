# Interface: IBlobStorage

Interface describing an blob storage service.

## Extends

- `IService`

## Properties

### CLASS\_NAME

> `readonly` **CLASS\_NAME**: `string`

The name of the service.

#### Inherited from

`IService.CLASS_NAME`

## Methods

### bootstrap()?

> `optional` **bootstrap**(`nodeLoggingConnectorType`?): `Promise`\<`boolean`\>

Bootstrap the service by creating and initializing any resources it needs.

#### Parameters

• **nodeLoggingConnectorType?**: `string`

The node logging connector type, defaults to "node-logging".

#### Returns

`Promise`\<`boolean`\>

True if the bootstrapping process was successful.

#### Inherited from

`IService.bootstrap`

***

### start()?

> `optional` **start**(`nodeIdentity`, `nodeLoggingConnectorType`?): `Promise`\<`void`\>

The service needs to be started when the node is initialized.

#### Parameters

• **nodeIdentity**: `string`

The identity of the node starting the service.

• **nodeLoggingConnectorType?**: `string`

The node logging connector type, defaults to "node-logging".

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

`IService.start`

***

### stop()?

> `optional` **stop**(`nodeIdentity`, `nodeLoggingConnectorType`?): `Promise`\<`void`\>

The service needs to be stopped when the node is closed.

#### Parameters

• **nodeIdentity**: `string`

The identity of the node stopping the service.

• **nodeLoggingConnectorType?**: `string`

The node logging connector type, defaults to "node-logging".

#### Returns

`Promise`\<`void`\>

Nothing.

#### Inherited from

`IService.stop`

***

### create()

> **create**(`blob`, `metadata`?, `options`?): `Promise`\<`string`\>

Create the blob with some metadata.

#### Parameters

• **blob**: `string`

The data for the blob in base64 format.

• **metadata?**: `IProperty`[]

Metadata to associate with the blob.

• **options?**

Additional options for the blob service.

• **options.namespace?**: `string`

The namespace to use for storing, defaults to service configured namespace.

#### Returns

`Promise`\<`string`\>

The id of the stored blob in urn format.

***

### get()

> **get**(`id`, `includeContent`): `Promise`\<`object`\>

Get the blob and metadata.

#### Parameters

• **id**: `string`

The id of the blob to get in urn format.

• **includeContent**: `boolean`

Include the content, or just get the metadata.

#### Returns

`Promise`\<`object`\>

The metadata and data for the blob if it can be found.

##### blob?

> `optional` **blob**: `string`

##### metadata

> **metadata**: `IProperty`[]

#### Throws

Not found error if the blob cannot be found.

***

### update()

> **update**(`id`, `metadata`): `Promise`\<`void`\>

Update the blob with metadata.

#### Parameters

• **id**: `string`

The id of the blob metadata to update.

• **metadata**: `IProperty`[]

Metadata to associate with the blob.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Not found error if the blob cannot be found.

***

### remove()

> **remove**(`id`): `Promise`\<`void`\>

Remove the blob.

#### Parameters

• **id**: `string`

The id of the blob to remove in urn format.

#### Returns

`Promise`\<`void`\>

Nothing.

#### Throws

Not found error if the blob cannot be found.
