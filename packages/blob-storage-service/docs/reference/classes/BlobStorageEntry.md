# Class: BlobStorageEntry

Class representing entry for the blob storage.

## Constructors

### Constructor

> **new BlobStorageEntry**(): `BlobStorageEntry`

#### Returns

`BlobStorageEntry`

## Properties

### id

> **id**: `string`

The id for the blob.

***

### dateCreated

> **dateCreated**: `string`

The date/time when the entry was created.

***

### dateModified?

> `optional` **dateModified**: `string`

The date/time when the entry was modified.

***

### blobSize

> **blobSize**: `number`

The length of the data in the blob.

***

### blobHash

> **blobHash**: `string`

The hash of the data in the blob.

***

### encodingFormat?

> `optional` **encodingFormat**: `string`

The mime type for the blob.

***

### fileExtension?

> `optional` **fileExtension**: `string`

The extension.

***

### metadata?

> `optional` **metadata**: `IJsonLdNodeObject`

The metadata for the blob as JSON-LD.

***

### isEncrypted

> **isEncrypted**: `boolean`

Is the entry encrypted.

***

### compression?

> `optional` **compression**: `BlobStorageCompressionType`

Is the entry compressed.

***

### userIdentity?

> `optional` **userIdentity**: `string`

The user identity that created the blob.

***

### nodeIdentity?

> `optional` **nodeIdentity**: `string`

The node identity that created the blob.
