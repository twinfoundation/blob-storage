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

> `optional` **bootstrap**(`nodeLoggingConnectorType`?): `Promise`\<`void`\>

Bootstrap the service by creating and initializing any resources it needs.

#### Parameters

• **nodeLoggingConnectorType?**: `string`

The node logging connector type, defaults to "node-logging".

#### Returns

`Promise`\<`void`\>

Nothing.

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

### set()

> **set**(`blob`, `options`?): `Promise`\<`string`\>

Set the blob.

#### Parameters

• **blob**: `Uint8Array`

The data for the blob.

• **options?**

Additional options for the blob service.

• **options.namespace?**: `string`

The namespace to use for storing, defaults to service configured namespace.

#### Returns

`Promise`\<`string`\>

The id of the stored blob in urn format.

***

### get()

> **get**(`id`): `Promise`\<`Uint8Array`\>

Get the blob.

#### Parameters

• **id**: `string`

The id of the blob to get in urn format.

#### Returns

`Promise`\<`Uint8Array`\>

The data for the blob if it can be found.

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
