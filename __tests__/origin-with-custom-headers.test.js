const { createComponent, assertHasCacheBehavior, assertHasOrigin } = require('../test-utils')
const { mockCreateDistribution, mockCreateDistributionPromise } = require('aws-sdk')

describe('Input origin with custom header', () => {
  let component

  beforeEach(async () => {
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'xyz'
      }
    })

    component = await createComponent()
  })

  it('creates distribution with custom url origin', async () => {
    await component.default({
      origins: [
        {
          url: 'https://exampleorigin.com',
          pathPatterns: {
            '/some/path': {
              ttl: 10,
              allowedHttpMethods: ['GET', 'HEAD', 'POST']
            }
          },
          headers: {
            'x-api-key': 'test'
          }
        }
      ]
    })

    assertHasOrigin(mockCreateDistribution, {
      Id: 'exampleorigin.com',
      DomainName: 'exampleorigin.com',
      CustomHeaders: {
        Quantity: 1,
        Items: [{ HeaderName: 'x-api-key', HeaderValue: 'test' }]
      }
    })

    assertHasCacheBehavior(mockCreateDistribution, {
      PathPattern: '/some/path',
      MinTTL: 10,
      TargetOriginId: 'exampleorigin.com'
    })

    expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })
})
