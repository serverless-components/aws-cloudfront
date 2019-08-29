module.exports = async (cf) => {
  const {
    CloudFrontOriginAccessIdentity: { Id }
  } = await cf
    .createCloudFrontOriginAccessIdentity({
      CloudFrontOriginAccessIdentityConfig: {
        CallerReference: 'serverless-managed-cloudfront-access-identity',
        Comment: 'CloudFront Origin Access Identity created to allow serving private S3 content'
      }
    })
    .promise()

  console.log('TCL: S3CanonicalUserId', Id)

  return Id
}
