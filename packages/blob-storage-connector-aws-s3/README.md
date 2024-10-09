# TWIN Blob Storage Connector AWS S3

Blob Storage connector implementation using [AWS S3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/).

## Installation

```shell
npm install @twin.org/blob-storage-connector-aws-s3
```

## Testing

The tests developed are functional tests and need an instance of AWS S3 up and running. To run AWS S3 locally:

```shell
docker run -p 9000:9000 -p 9001:9001 quay.io/minio/minio server /data --console-address ":9001"
```

Afterwards you can run the tests as follows:

```shell
npm run test
```

## Examples

Usage of the APIs is shown in the examples [docs/examples.md](docs/examples.md)

## Reference

Detailed reference documentation for the API can be found in [docs/reference/index.md](docs/reference/index.md)

## Changelog

The changes between each version can be found in [docs/changelog.md](docs/changelog.md)
