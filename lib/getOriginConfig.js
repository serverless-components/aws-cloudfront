const url = require('url')

module.exports = (origin, { originAccessIdentityId = '' }) => {
  const originUrl = typeof origin === 'string' ? origin : origin.url

  const { hostname, pathname } = url.parse(originUrl)

  const originConfig = {
    Id: `${hostname}${pathname}`.replace(/\/$/, ''),
    DomainName: hostname,
    CustomHeaders: {
      Quantity: 0,
      Items: []
    },
    OriginPath: pathname === '/' ? '' : pathname
  }

  if (originUrl.includes('s3') && !originUrl.includes('s3-website')) {
    // attach s3 origin for buckets, but don't do this for buckets configured as website
    const bucketName = hostname.split('.')[0]
    originConfig.Id = pathname === '/' ? bucketName : `${bucketName}${pathname}`
    originConfig.DomainName = `${bucketName}.s3.amazonaws.com`
    originConfig.S3OriginConfig = {
      OriginAccessIdentity: originAccessIdentityId
        ? `origin-access-identity/cloudfront/${originAccessIdentityId}`
        : ''
    }
  } else {
    originConfig.CustomOriginConfig = {
      HTTPPort: 80,
      HTTPSPort: 443,
      OriginProtocolPolicy: origin.protocolPolicy || 'https-only',
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
