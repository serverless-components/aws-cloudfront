const {
  mockCreateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise
} = require('aws-sdk')

const CloudFrontComponent = require('../serverless')

describe('simple origin', () => {
  let component

  beforeEach(async () => {
    component = new CloudFrontComponent()

    mockGetDistributionConfigPromise.mockResolvedValueOnce({
      ETag: 'etag'
    })
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'xyz'
      }
    })

    await component.init()
    await component.default({
      origins: ['https://exampleorigin.com']
    })
  })

  afterEach(async () => {
    await component.remove()
  })

  it(`creates CloudFront distribution with origin domain name "https://exampleorigin.com"`, () => {
    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              expect.objectContaining({
                Id: 'https://exampleorigin.com',
                DomainName: 'https://exampleorigin.com'
              })
            ]
          })
        })
      })
    )
  })
})
