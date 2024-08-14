# Function: blobStorageCreate()

> **blobStorageCreate**(`httpRequestContext`, `factoryServiceName`, `request`): `Promise`\<`ICreatedResponse`\>

Create a blob in storage.

## Parameters

• **httpRequestContext**: `IHttpRequestContext`

The request context for the API.

• **factoryServiceName**: `string`

The name of the service to use in the routes.

• **request**: `IBlobStorageCreateRequest`

The request.

## Returns

`Promise`\<`ICreatedResponse`\>

The response object with additional http response properties.
