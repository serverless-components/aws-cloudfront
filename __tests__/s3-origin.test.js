const {
  mockCreateDistribution,
  mockUpdateDistribution,
  mockCreateDistributionPromise,
  mockGetDistributionConfigPromise,
  mockUpdateDistributionPromise,
  mockCreateCloudFrontOriginAccessIdentityPromise,
  mockPutBucketPolicy
} = require('aws-sdk')

const { createComponent, assertHasOrigin } = require('../test-utils')

describe('S3 origins', () => {
  let component

  beforeEach(async () => {
    mockCreateDistributionPromise.mockResolvedValueOnce({
      Distribution: {
        Id: 'distributionwithS3origin'
      }
    })

    component = await createComponent()
  })

  describe('When origin is an S3 bucket URL', () => {
    it('creates distribution', async () => {
      await component.default({
        origins: ['https://mybucket.s3.amazonaws.com']
      })

      assertHasOrigin(mockCreateDistribution, {
        Id: 'mybucket',
        DomainName: 'mybucket.s3.amazonaws.com',
        S3OriginConfig: {
          OriginAccessIdentity: ''
        },
        CustomHeaders: {
          Quantity: 0,
          Items: []
        },
        OriginPath: ''
      })

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

      assertHasOrigin(mockUpdateDistribution, {
        Id: 'anotherbucket',
        DomainName: 'anotherbucket.s3.amazonaws.com'
      })

      expect(mockUpdateDistribution.mock.calls[0][0]).toMatchSnapshot()
    })
  })

  describe('When origin is an S3 bucket URL with path', () => {
    it('creates distribution', async () => {
      await component.default({
        origins: ['https://mybucket.s3.amazonaws.com/static']
      })

      assertHasOrigin(mockCreateDistribution, {
        Id: 'mybucket/static',
        DomainName: 'mybucket.s3.amazonaws.com',
        S3OriginConfig: {
          OriginAccessIdentity: ''
        },
        CustomHeaders: {
          Quantity: 0,
          Items: []
        },
        OriginPath: '/static'
      })

      expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
    })
  })

  describe('When origin is an S3 website URL', () => {
    it('creates custom origin not s3 origin distribution', async () => {
      await component.default({
        origins: ['https://mybucket.s3-website.amazonaws.com']
      })

      assertHasOrigin(mockCreateDistribution, {
        Id: 'mybucket.s3-website.amazonaws.com',
        DomainName: 'mybucket.s3-website.amazonaws.com',
        CustomHeaders: {
          Quantity: 0,
          Items: []
        },
        CustomOriginConfig: {
          HTTPPort: 80,
          HTTPSPort: 443,
          OriginProtocolPolicy: 'https-only',
          OriginSslProtocols: {
            Quantity: 1,
            Items: ['TLSv1.2']
          },
          OriginReadTimeout: 30,
          OriginKeepaliveTimeout: 5
        },
        OriginPath: ''
      })

      expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
    })
  })

  describe('When origin is an S3 URL only accessible via CloudFront', () => {
    it('creates distribution', async () => {
      mockCreateCloudFrontOriginAccessIdentityPromise.mockResolvedValueOnce({
        CloudFrontOriginAccessIdentity: {
          Id: 'access-identity-xyz',
          S3CanonicalUserId: 's3-canonical-user-id-xyz'
        }
      })

      await component.default({
        origins: [
          {
            url: 'https://mybucket.s3.amazonaws.com',
            private: true
          }
        ]
      })

      expect(mockPutBucketPolicy).toBeCalledWith({
        Bucket: 'mybucket',
        Policy: expect.stringContaining('"CanonicalUser":"s3-canonical-user-id-xyz"')
      })

      assertHasOrigin(mockCreateDistribution, {
        Id: 'mybucket',
        DomainName: 'mybucket.s3.amazonaws.com',
        S3OriginConfig: {
          OriginAccessIdentity: 'origin-access-identity/cloudfront/access-identity-xyz'
        },
        CustomHeaders: {
          Quantity: 0,
          Items: []
        },
        OriginPath: ''
      })

      expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
    })

    it('updates distribution', async () => {
      mockCreateCloudFrontOriginAccessIdentityPromise.mockResolvedValue({
        CloudFrontOriginAccessIdentity: {
          Id: 'access-identity-xyz',
          S3CanonicalUserId: 's3-canonical-user-id-xyz'
        }
      })

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
        origins: [
          {
            url: 'https://mybucket.s3.amazonaws.com',
            private: true
          }
        ]
      })

      await component.default({
        origins: [
          {
            url: 'https://anotherbucket.s3.amazonaws.com',
            private: true
          }
        ]
      })

      expect(mockPutBucketPolicy).toBeCalledWith({
        Bucket: 'anotherbucket',
        Policy: expect.stringContaining('"CanonicalUser":"s3-canonical-user-id-xyz"')
      })

      assertHasOrigin(mockUpdateDistribution, {
        Id: 'anotherbucket',
        DomainName: 'anotherbucket.s3.amazonaws.com',
        S3OriginConfig: {
          OriginAccessIdentity: 'origin-access-identity/cloudfront/access-identity-xyz'
        },
        OriginPath: '',
        CustomHeaders: { Items: [], Quantity: 0 }
      })

      expect(mockCreateDistribution.mock.calls[0][0]).toMatchSnapshot()
    })
  })
})
