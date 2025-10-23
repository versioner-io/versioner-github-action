import * as core from '@actions/core'
import { getInputs } from './inputs'
import { getGitHubMetadata } from './github-context'
import { sendDeploymentEvent } from './api-client'
import { DeploymentEventPayload } from './types'

/**
 * Main action entrypoint
 */
async function run(): Promise<void> {
  try {
    // Get and validate inputs
    core.info('📦 Versioner Deployment Tracker')
    core.info('================================')

    const inputs = getInputs()
    core.info(`Product: ${inputs.productName}`)
    core.info(`Version: ${inputs.version}`)
    core.info(`Environment: ${inputs.environment}`)
    core.info(`Status: ${inputs.status}`)

    // Get GitHub context metadata
    const githubMetadata = getGitHubMetadata()
    core.info(`Repository: ${githubMetadata.scm_repository}`)
    core.info(`SHA: ${githubMetadata.scm_sha}`)
    core.info(`Deployed by: ${githubMetadata.deployed_by}`)

    // Merge user metadata with GitHub metadata
    const payload: DeploymentEventPayload = {
      product_name: inputs.productName,
      version: inputs.version,
      environment: inputs.environment,
      status: inputs.status,
      ...githubMetadata,
      extra_metadata: {
        ...inputs.metadata,
      },
    }

    // Send deployment event to Versioner API
    core.info('')
    core.info('Sending deployment event to Versioner...')
    const response = await sendDeploymentEvent(inputs.apiUrl, inputs.apiKey, payload)

    // Set outputs
    core.setOutput('deployment_id', response.deployment_id)
    core.setOutput('event_id', response.event_id)

    // Success summary
    core.info('')
    core.info('✅ Deployment tracked successfully!')
    core.info(`   Deployment ID: ${response.deployment_id}`)
    core.info(`   Event ID: ${response.event_id}`)

    // Create GitHub annotation for visibility
    core.notice(
      `Deployment tracked: ${inputs.productName}@${inputs.version} → ${inputs.environment} (${inputs.status})`
    )
  } catch (error) {
    // Handle errors and fail the action
    const errorMessage = error instanceof Error ? error.message : String(error)
    core.setFailed(`❌ Failed to track deployment: ${errorMessage}`)

    // Add error annotation
    core.error(errorMessage)
  }
}

// Run the action
run()
