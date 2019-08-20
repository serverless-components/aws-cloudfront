# aws-cloudfront

&nbsp;

Deploy an AWS CloudFront distribution for the provided origins using [Serverless Components](https://github.com/serverless/components).

&nbsp;

1. [Install](#1-install)
2. [Create](#2-create)
3. [Configure](#3-configure)
4. [Deploy](#4-deploy)

&nbsp;

### 1. Install

```console
$ npm install -g serverless
```

### 2. Create

```console
$ mkdir cdn
$ cd cdn
```

the directory should look something like this:

```
|- serverless.yml
|- .env      # your AWS api keys

```

```
# .env
AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
```

### 3. Configure

```yml
# serverless.yml

myWebsite:
  component: '@serverless/aws-cloudfront'
  inputs:
    region: us-east-1
    enabled: true # optional
    origins:
      - https://my-bucket.s3.amazonaws.com
```

### 4. Deploy

```console
$ serverless
```

&nbsp;

### New to Components?

Checkout the [Serverless Components](https://github.com/serverless/components) repo for more information.
