const url = require('url')

module.exports = (origin, { s3CanonicalUserId = '' }) => {
  const originUrl = typeof origin === 'string' ? origin : origin.url

  const { hostname } = url.parse(originUrl)

  const originConfig = {
    Id: hostname,
    DomainName: hostname,
    CustomHeaders: {
      Quantity: 0,
      Items: []
    },
    OriginPath: ''
  }

  if (originUrl.includes('s3')) {
    const bucketName = hostname.split('.')[0]
    originConfig.Id = bucketName
    originConfig.DomainName = `${bucketName}.s3.amazonaws.com`
    originConfig.S3OriginConfig = {
      OriginAccessIdentity: s3CanonicalUserId
    }
  } else {
    originConfig.CustomOriginConfig = {
      HTTPPort: 80,
      HTTPSPort: 443,
      OriginProtocolPolicy: 'https-only',
      OriginSslProtocols: {
        Quantity: 1,
        Items: ['TLSv1.2']
      },
      OriginReadTimeout: 30,
      OriginKeepaliveTimeout: 5
    }
  }

  return originConfig
}
