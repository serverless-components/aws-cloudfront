const getOriginConfig = require('./getOriginConfig')
const getCacheBehavior = require('./getCacheBehavior')

module.exports = (origins, options) => {
  const distributionOrigins = {
    Quantity: 0,
    Items: []
  }
  let distributionCacheBehaviors

  for (const origin of origins) {
    const originConfig = getOriginConfig(origin, options)

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
