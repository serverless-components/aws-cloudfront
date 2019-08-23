const promisifyMock = (mockFn) => {
  const promise = jest.fn()
  mockFn.mockImplementation(() => ({
    promise
  }))

  return promise
}

const mockCreateDistribution = jest.fn()
const mockCreateDistributionPromise = promisifyMock(mockCreateDistribution)

const mockGetDistributionConfig = jest.fn()
const mockGetDistributionConfigPromise = promisifyMock(mockGetDistributionConfig)

const mockDeleteDistribution = jest.fn()
const mockDeleteDistributionPromise = promisifyMock(mockDeleteDistribution)

jest.mock('aws-sdk', () => ({
  CloudFront: jest.fn(() => ({
    createDistribution: mockCreateDistribution,
    getDistributionConfig: mockGetDistributionConfig,
    deleteDistribution: mockDeleteDistribution
  }))
}))

module.exports = {
  mockCreateDistribution,
  mockGetDistributionConfig,
  mockDeleteDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockDeleteDistributionPromise
}
