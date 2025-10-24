import * as core from '@actions/core'
import { getInputs } from './inputs'
import { getGitHubMetadata } from './github-context'
import { sendDeploymentEvent, sendVersionEvent } from './api-client'
import { DeploymentEventPayload, VersionEventPayload } from './types'

/**
 * Main action entrypoint
 */
async function run(): Promise<void> {
  try {
    // Get and validate inputs
    core.info('📦 Versioner Deployment Tracker')
    core.info('================================')

    const inputs = getInputs()

    // Get GitHub context metadata
    const githubMetadata = getGitHubMetadata()

    // Default product_name to repository name if not provided
    const productName = inputs.productName || githubMetadata.scm_repository.split('/')[1]

    core.info(`Event Type: ${inputs.eventType}`)
    core.info(`Product: ${productName}`)
    core.info(`Version: ${inputs.version}`)
    if (inputs.environment) {
      core.info(`Environment: ${inputs.environment}`)
    }
    core.info(`Status: ${inputs.status}`)
    core.info(`Repository: ${githubMetadata.scm_repository}`)
    core.info(`SHA: ${githubMetadata.scm_sha}`)
    core.info(`Deployed by: ${githubMetadata.deployed_by}`)

    // Route to appropriate endpoint based on event type
    core.info('')
    if (inputs.eventType === 'build') {
      // Build version event payload
      const payload: VersionEventPayload = {
        product_name: productName,
        version: inputs.version,
        scm_repository: githubMetadata.scm_repository,
        scm_sha: githubMetadata.scm_sha,
        scm_branch: githubMetadata.scm_branch,
        source_system: githubMetadata.source_system,
        build_number: githubMetadata.build_number,
        invoke_id: githubMetadata.invoke_id,
        build_url: githubMetadata.build_url,
        built_by: githubMetadata.deployed_by,
        built_by_email: githubMetadata.deployed_by_email,
        built_by_name: githubMetadata.deployed_by_name,
        built_at: new Date().toISOString(),
        extra_metadata: inputs.metadata,
      }

      core.info('Sending version event to Versioner...')
      const response = await sendVersionEvent(inputs.apiUrl, inputs.apiKey, payload, inputs.failOnRejection)

      // Set outputs
      core.setOutput('version_id', response.version_id)
      core.setOutput('product_id', response.product_id)

      // Success summary
      core.info('')
      core.info(`✅ Build tracked successfully!`)
      core.info(`   Version ID: ${response.version_id}`)
      core.info(`   Product ID: ${response.product_id}`)

      // Create GitHub annotation for visibility
      core.notice(`Build tracked: ${productName}@${inputs.version} (${inputs.status})`)
    } else {
      // Build deployment event payload
      const payload: DeploymentEventPayload = {
        product_name: productName,
        version: inputs.version,
        environment_name: inputs.environment,
        status: inputs.status,
        scm_repository: githubMetadata.scm_repository,
        scm_sha: githubMetadata.scm_sha,
        source_system: githubMetadata.source_system,
        build_number: githubMetadata.build_number,
        invoke_id: githubMetadata.invoke_id,
        build_url: githubMetadata.build_url,
        deployed_by: githubMetadata.deployed_by,
        deployed_by_email: githubMetadata.deployed_by_email,
        deployed_by_name: githubMetadata.deployed_by_name,
        completed_at: new Date().toISOString(),
        extra_metadata: inputs.metadata,
      }

      core.info('Sending deployment event to Versioner...')
      const response = await sendDeploymentEvent(inputs.apiUrl, inputs.apiKey, payload, inputs.failOnRejection)

      // Set outputs
      core.setOutput('deployment_id', response.deployment_id)
      core.setOutput('event_id', response.event_id)

      // Success summary
      core.info('')
      core.info(`✅ Deployment tracked successfully!`)
      core.info(`   Deployment ID: ${response.deployment_id}`)
      core.info(`   Event ID: ${response.event_id}`)

      // Create GitHub annotation for visibility
      core.notice(
        `Deployment tracked: ${productName}@${inputs.version} → ${inputs.environment} (${inputs.status})`
      )
    }
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
