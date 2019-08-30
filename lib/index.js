const parseInputOrigins = require('./parseInputOrigins')
const getDefaultCacheBehavior = require('./getDefaultCacheBehavior')

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
  distributionConfig.DefaultCacheBehavior = getDefaultCacheBehavior(
    Origins.Items[0].Id,
    inputs.defaults
  )

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

  params.DistributionConfig.DefaultCacheBehavior = getDefaultCacheBehavior(
    Origins.Items[0].Id,
    inputs.defaults
  )
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
