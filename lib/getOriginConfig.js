const url = require('url')

module.exports = (origin, { originAccessIdentityId = '' }) => {
  const originUrl = typeof origin === 'string' ? origin : origin.url

  const { hostname, pathname } = url.parse(originUrl)

  const originConfig = {
    Id: hostname,
    DomainName: hostname,
    CustomHeaders: {
      Quantity: 0,
      Items: []
    },
    OriginPath: pathname === '/' ? '' : pathname
  }

  if (originUrl.includes('s3')) {
    const bucketName = hostname.split('.')[0]
    originConfig.Id = bucketName
    originConfig.DomainName = `${bucketName}.s3.amazonaws.com`
    originConfig.S3OriginConfig = {
      OriginAccessIdentity: originAccessIdentityId
        ? `origin-access-identity/cloudfront/${originAccessIdentityId}`
        : ''
    }
  } else {
    if (origin.headers) {
      originConfig.CustomHeaders.Quantity = Object.keys(origin.headers).length
      originConfig.CustomHeaders.Items = Object.keys(origin.headers).map((key) => ({
        HeaderName: key,
        HeaderValue: origin.headers[key]
      }))
    }

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
