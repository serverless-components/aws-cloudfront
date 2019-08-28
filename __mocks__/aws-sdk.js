const promisifyMock = (mockFn) => {
  const promise = jest.fn()
  mockFn.mockImplementation(() => ({
    promise
  }))

  return promise
}

const mockCreateDistribution = jest.fn()
const mockCreateDistributionPromise = promisifyMock(mockCreateDistribution)

const mockUpdateDistribution = jest.fn()
const mockUpdateDistributionPromise = promisifyMock(mockUpdateDistribution)

const mockGetDistributionConfig = jest.fn()
const mockGetDistributionConfigPromise = promisifyMock(mockGetDistributionConfig)

const mockDeleteDistribution = jest.fn()
const mockDeleteDistributionPromise = promisifyMock(mockDeleteDistribution)

const mockCreateCloudFrontOriginAccessIdentity = jest.fn()
const mockCreateCloudFrontOriginAccessIdentityPromise = promisifyMock(
  mockCreateCloudFrontOriginAccessIdentity
)

module.exports = {
  mockCreateDistribution,
  mockUpdateDistribution,
  mockGetDistributionConfig,
  mockDeleteDistribution,
  mockCreateCloudFrontOriginAccessIdentity,
  mockCreateDistributionPromise,
  mockUpdateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockDeleteDistributionPromise,
  mockCreateCloudFrontOriginAccessIdentityPromise,

  CloudFront: jest.fn(() => ({
    createDistribution: mockCreateDistribution,
    updateDistribution: mockUpdateDistribution,
    getDistributionConfig: mockGetDistributionConfig,
    deleteDistribution: mockDeleteDistribution,
    createCloudFrontOriginAccessIdentity: mockCreateCloudFrontOriginAccessIdentity
  }))
}
