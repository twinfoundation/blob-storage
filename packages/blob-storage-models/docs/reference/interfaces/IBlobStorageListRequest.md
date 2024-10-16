# Interface: IBlobStorageListRequest

Query the entries from blob storage.

## Properties

### query?

> `optional` **query**: `object`

The parameters from the query.

#### conditions?

> `optional` **conditions**: `string`

The condition for the query as JSON version of EntityCondition type.

#### sortProperties?

> `optional` **sortProperties**: `string`

The sort property array as JSON serialization of property,direction.

#### pageSize?

> `optional` **pageSize**: `number`

The number of entries to return per page.

#### cursor?

> `optional` **cursor**: `string`

The cursor to get next chunk of data, returned in previous response.
