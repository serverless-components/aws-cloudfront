const {
  mockCreateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise
} = require('aws-sdk')

const CloudFrontComponent = require('../serverless')

describe('S3 origin', () => {
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
      origins: ['https://mybucket.s3.amazonaws.com']
    })
  })

  afterEach(async () => {
    await component.remove()
  })

  it('creates CloudFront distribution with origin domain name "mybucket.s3.amazonaws.com"', () => {
    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              expect.objectContaining({
                Id: 'mybucket',
                DomainName: 'mybucket.s3.amazonaws.com'
              })
            ]
          })
        })
      })
    )
  })
})
