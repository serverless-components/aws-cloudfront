const {
  mockCreateDistribution,
  mockUpdateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockUpdateDistributionPromise
} = require('aws-sdk')

const { createComponent } = require('../test-utils')

describe('Input origin as an S3 bucket url', () => {
  let component

  beforeEach(async () => {
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3origin'
      }
    })

    component = await createComponent()
  })

  it('creates distribution with S3 origin', async () => {
    await component.default({
      origins: ['https://mybucket.s3.amazonaws.com']
    })

    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'mybucket',
                DomainName: 'mybucket.s3.amazonaws.com',
                S3OriginConfig: {
                  OriginAccessIdentity: ''
                }
              }
            ]
          })
        })
      })
    )
    expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })

  it('updates distribution', async () => {
    mockGetDistributionConfigPromise.mockResolvedValueOnce({
      ETag: 'etag',
      DistributionConfig: {
        Origins: {
          Items: []
        }
      }
    })
    mockUpdateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3originupdated'
      }
    })

    await component.default({
      origins: ['https://mybucket.s3.amazonaws.com']
    })

    await component.default({
      origins: ['https://anotherbucket.s3.amazonaws.com']
    })

    expect(mockUpdateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              expect.objectContaining({
                Id: 'anotherbucket',
                DomainName: 'anotherbucket.s3.amazonaws.com'
              })
            ]
          })
        })
      })
    )

    expect(mockUpdateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })
})
