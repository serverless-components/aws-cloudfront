const getOriginConfig = require('./getOriginConfig')
const getCacheBehavior = require('./getCacheBehavior')

const validLambdaTriggers = [
  'viewer-request',
  'origin-request',
  'origin-response',
  'viewer-response'
]
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
        const pathPatternConfig = origin.pathPatterns[pathPattern]
        const cacheBehavior = getCacheBehavior(pathPattern, pathPatternConfig, originConfig.Id)

        const lambdaAtEdge = pathPatternConfig['lambda@edge'] || {}

        Object.keys(lambdaAtEdge).forEach((eventType) => {
          if (!validLambdaTriggers.includes(eventType)) {
            throw new Error(
              `"${eventType}" is not a valid lambda trigger. See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-cloudfront-trigger-events.html for valid event types.`
            )
          }

          cacheBehavior.LambdaFunctionAssociations.Quantity =
            cacheBehavior.LambdaFunctionAssociations.Quantity + 1
          cacheBehavior.LambdaFunctionAssociations.Items.push({
            EventType: eventType,
            LambdaFunctionARN: lambdaAtEdge[eventType],
            IncludeBody: true
          })
        })

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
