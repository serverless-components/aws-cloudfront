const url = require('url')

const getOriginConfig = (origin) => {
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
      OriginAccessIdentity: ''
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

const getCacheBehavior = (pathPattern, pathPatternConfig, originId) => {
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
    DefaultTTL: 0,
    MaxTTL: 0,
    FieldLevelEncryptionId: '',
    LambdaFunctionAssociations: {
      Quantity: 0,
      Items: []
    }
  }
}

const getDefaultCacheBehavior = (originId) => {
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
    DefaultTTL: 86400,
    MaxTTL: 31536000,
    Compress: false,
    LambdaFunctionAssociations: {
      Quantity: 0,
      Items: []
    },
    FieldLevelEncryptionId: ''
  }
}

const parseInputOrigins = (origins) => {
  const distributionOrigins = {
    Quantity: 0,
    Items: []
  }
  let distributionCacheBehaviors

  for (const origin of origins) {
    const originConfig = getOriginConfig(origin)

    distributionOrigins.Quantity = distributionOrigins.Quantity + 1
    distributionOrigins.Items.push(originConfig)

    if (typeof origin === 'object') {
      // add any cache behaviors
      for (const pathPattern in origin.pathPatterns) {
        const cacheBehavior = getCacheBehavior(
          pathPattern,
          origin.pathPatterns[pathPattern],
          originConfig.Id
        )

        distributionCacheBehaviors = {
          Quantity: 0,
          Items: []
        }
        distributionCacheBehaviors.Quantity = distributionCacheBehaviors.Quantity + 1
        distributionCacheBehaviors.Items.push(cacheBehavior)
      }
    }
  }

  return {
    Origins: distributionOrigins,
    CacheBehaviors: distributionCacheBehaviors
  }
}

const createCloudFrontDistribution = async (cf, inputs) => {
  const params = {
    DistributionConfig: {
      CallerReference: String(Date.now()),
      Comment: '',
      Aliases: {
        Quantity: 0,
        Items: []
      },
      Origins: {
        Quantity: 0,
        Items: []
      },
      PriceClass: 'PriceClass_All',
      Enabled: inputs.enabled === false ? false : true,
      HttpVersion: 'http2'
    }
  }

  const distributionConfig = params.DistributionConfig

  const { Origins, CacheBehaviors } = parseInputOrigins(inputs.origins)

  distributionConfig.Origins = Origins

  // set first origin declared as the default cache behavior
  distributionConfig.DefaultCacheBehavior = getDefaultCacheBehavior(Origins.Items[0].Id)

  if (CacheBehaviors) {
    distributionConfig.CacheBehaviors = CacheBehaviors
  }

  const res = await cf.createDistribution(params).promise()

  return {
    id: res.Distribution.Id,
    arn: res.Distribution.ARN,
    url: `https://${res.Distribution.DomainName}`
  }
}

const updateCloudFrontDistribution = async (cf, distributionId, inputs) => {
  // Update logic is a bit weird...
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFront.html#updateDistribution-property

  // 1. we gotta get the config first...
  // todo what if id does not exist?
  const params = await cf.getDistributionConfig({ Id: distributionId }).promise()

  // 2. then add this property
  params.IfMatch = params.ETag

  // 3. then delete this property
  delete params.ETag

  // 4. then set this property
  params.Id = distributionId

  // 5. then make our changes

  params.DistributionConfig.Enabled = inputs.enabled === false ? false : true

  const { Origins, CacheBehaviors } = parseInputOrigins(inputs.origins)

  params.DistributionConfig.DefaultCacheBehavior = getDefaultCacheBehavior(Origins.Items[0].Id)
  params.DistributionConfig.Origins = Origins

  if (CacheBehaviors) {
    params.DistributionConfig.CacheBehaviors = CacheBehaviors
  }

  // 6. then finally update!
  const res = await cf.updateDistribution(params).promise()

  return {
    id: res.Distribution.Id,
    arn: res.Distribution.ARN,
    url: `https://${res.Distribution.DomainName}`
  }
}

const disableCloudFrontDistribution = async (cf, distributionId) => {
  const params = await cf.getDistributionConfig({ Id: distributionId }).promise()

  params.IfMatch = params.ETag

  delete params.ETag

  params.Id = distributionId

  params.DistributionConfig.Enabled = false

  const res = await cf.updateDistribution(params).promise()

  return {
    id: res.Distribution.Id,
    arn: res.Distribution.ARN,
    url: `https://${res.Distribution.DomainName}`
  }
}

const deleteCloudFrontDistribution = async (cf, distributionId) => {
  try {
    const res = await cf.getDistributionConfig({ Id: distributionId }).promise()

    const params = { Id: distributionId, IfMatch: res.ETag }
    await cf.deleteDistribution(params).promise()
  } catch (e) {
    if (e.code === 'DistributionNotDisabled') {
      await disableCloudFrontDistribution(cf, distributionId)
    } else {
      throw e
    }
  }
}

module.exports = {
  createCloudFrontDistribution,
  updateCloudFrontDistribution,
  deleteCloudFrontDistribution
}
