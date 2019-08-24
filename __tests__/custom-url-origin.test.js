const { createComponent } = require('../test-utils')

const {
  mockCreateDistribution,
  mockUpdateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockUpdateDistributionPromise
} = require('aws-sdk')

describe('Input origin as a custom url', () => {
  let component

  beforeEach(async () => {
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distribution123'
      }
    })

    component = await createComponent()
  })

  it('creates distribution with custom url origin', async () => {
    await component.default({
      origins: ['https://mycustomorigin.com']
    })

    expect(mockCreateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'mycustomorigin.com',
                DomainName: 'mycustomorigin.com',
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'https-only'
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
        Id: 'xyz'
      }
    })

    await component.default({
      origins: ['https://mycustomorigin.com']
    })

    await component.default({
      origins: ['https://mycustomoriginupdated.com']
    })

    expect(mockUpdateDistribution).toBeCalledWith(
      expect.objectContaining({
        DistributionConfig: expect.objectContaining({
          Origins: expect.objectContaining({
            Items: [
              {
                Id: 'mycustomoriginupdated.com',
                DomainName: 'mycustomoriginupdated.com',
                CustomOriginConfig: {
                  HTTPPort: 80,
                  HTTPSPort: 443,
                  OriginProtocolPolicy: 'https-only'
                }
              }
            ]
          })
        })
      })
    )

    expect(mockUpdateDistribution.mock.calls[0][0]).toMatchSnapshot()
  })
})
