module.exports = (pathPattern, pathPatternConfig, originId) => {
  const { ttl } = pathPatternConfig

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
      Quantity: 2,
      Items: ['GET', 'HEAD'],
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
