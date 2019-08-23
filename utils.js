const getOriginConfig = (origin) => {
  const originConfig = {
    Id: origin,
    DomainName: origin,
    CustomHeaders: {
      Quantity: 0,
      Items: []
    },
    S3OriginConfig: {
      OriginAccessIdentity: ''
    }
  }

  if (origin.includes('s3')) {
    const bucketName = origin.replace('https://', '').split('.')[0]
    originConfig.Id = bucketName
    originConfig.DomainName = `${bucketName}.s3.amazonaws.com`
  }

  return originConfig
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

  for (const origin of inputs.origins) {
    const originConfig = getOriginConfig(origin)
    // console.log(originConfig)
    params.DistributionConfig.Origins.Quantity = params.DistributionConfig.Origins.Quantity + 1
    params.DistributionConfig.Origins.Items.push(originConfig)

    params.DistributionConfig.DefaultCacheBehavior = getDefaultCacheBehavior(originConfig.Id)
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

  for (const origin of inputs.origins) {
    params.DistributionConfig.Origins.Quantity = params.DistributionConfig.Origins.Quantity + 1
    params.DistributionConfig.Origins.Items.push(getOriginConfig(origin))
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
