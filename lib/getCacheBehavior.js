module.exports = (pathPattern, pathPatternConfig, originId) => {
  const { ttl, allowedHttpMethods } = pathPatternConfig
  const allowedMethods = allowedHttpMethods || ['GET', 'HEAD']

  return {
    ForwardedValues: {
      Cookies: {
        Forward: 'all'
      },
      QueryString: true,
      Headers: {
        Quantity: 0,
        Items: []
      },
      QueryStringCacheKeys: {
        Quantity: 0,
        Items: []
      }
    },
    MinTTL: ttl,
    PathPattern: pathPattern,
    TargetOriginId: originId,
    TrustedSigners: {
      Enabled: false,
      Quantity: 0
    },
    ViewerProtocolPolicy: 'https-only',
    AllowedMethods: {
      Quantity: allowedMethods.length,
      Items: allowedMethods,
      CachedMethods: {
        Items: ['GET', 'HEAD'],
        Quantity: 2
      }
    },
    Compress: true,
    SmoothStreaming: false,
    DefaultTTL: ttl,
    MaxTTL: ttl,
    FieldLevelEncryptionId: '',
    LambdaFunctionAssociations: {
      Quantity: 0,
      Items: []
    }
  }
}
