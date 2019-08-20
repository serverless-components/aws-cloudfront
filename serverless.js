const aws = require('aws-sdk')
const { equals } = require('ramda')
const { Component } = require('@serverless/core')
const {
  createCloudFrontDistribution,
  updateCloudFrontDistribution,
  deleteCloudFrontDistribution
} = require('./utils')

/*
 * Website
 */

class CloudFront extends Component {
  /*
   * Default
   */

  async default(inputs = {}) {
    this.context.status('Deploying')

    inputs.region = inputs.region || 'us-east-1'

    this.context.debug(
      `Starting deployment of CloudFront distribution to the ${inputs.region} region.`
    )

    const cf = new aws.CloudFront({
      credentials: this.context.credentials.aws,
      region: inputs.region
    })

    if (this.state.id) {
      if (!equals(this.state.origins, inputs.origins)) {
        this.context.debug(`Updating CloudFront distribution of ID ${this.state.id}.`)
        this.state = await updateCloudFrontDistribution(cf, this.state.id, inputs.origins)
      }
    } else {
      this.context.debug(`Creating CloudFront distribution in the ${inputs.region} region.`)
      this.state = await createCloudFrontDistribution(cf, inputs.origins)
    }

    this.state.region = inputs.region
    this.state.origins = inputs.origins
    await this.save()

    this.context.debug(`CloudFront deployed successfully with URL: https://${this.state.url}.`)

    return this.state
  }

  /**
   * Remove
   */

  async remove() {
    this.context.status(`Removing`)

    if (!this.state.id) {
      return
    }

    const cf = new aws.CloudFront({
      credentials: this.context.credentials.aws,
      region: this.state.region
    })

    await deleteCloudFrontDistribution(cf, this.state.id)

    this.state = {}
    await this.save()

    this.context.debug(`CloudFront distribution was successfully removed.`)
    return {}
  }
}

module.exports = CloudFront
