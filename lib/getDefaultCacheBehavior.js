module.exports = (originId, defaults = {}) => {
  return {
    TargetOriginId: originId,
    ForwardedValues: {
      QueryString: false,
      Cookies: {
        Forward: 'none'
      },
      Headers: {
        Quantity: 0,
        Items: []
      },
      QueryStringCacheKeys: {
        Quantity: 0,
        Items: []
      }
    },
    TrustedSigners: {
      Enabled: false,
      Quantity: 0,
      Items: []
    },
    ViewerProtocolPolicy: 'redirect-to-https',
    MinTTL: 0,
    AllowedMethods: {
      Quantity: 2,
      Items: ['HEAD', 'GET'],
      CachedMethods: {
        Quantity: 2,
        Items: ['HEAD', 'GET']
      }
    },
    SmoothStreaming: false,
    DefaultTTL: defaults.ttl || 86400,
    MaxTTL: 31536000,
    Compress: false,
    LambdaFunctionAssociations: {
      Quantity: 0,
      Items: []
    },
    FieldLevelEncryptionId: ''
  }
}
