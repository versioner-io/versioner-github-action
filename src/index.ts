import * as core from '@actions/core'
import * as fs from 'fs'
import { getInputs } from './inputs'
import { getGitHubMetadata } from './github-context'
import { sendDeploymentEvent, sendBuildEvent } from './api-client'
import { DeploymentEventPayload, BuildEventPayload } from './types'

/**
 * Get the Versioner hostname from API URL
 */
function getVersionerHostname(apiUrl: string): string {
  // Convert API URL to UI hostname
  // https://api.versioner.io -> https://app.versioner.io
  // https://development-api.versioner.io -> https://dev.versioner.io
  const url = new URL(apiUrl)
  if (url.hostname === 'api.versioner.io') {
    return 'https://app.versioner.io'
  } else if (url.hostname === 'development-api.versioner.io') {
    return 'https://dev.versioner.io'
  }
  // For custom domains, try to infer UI hostname
  return apiUrl.replace('api', 'app')
}

/**
 * Get status emoji based on status string
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'success':
      return '✅'
    case 'failure':
      return '❌'
    case 'in_progress':
      return '🔄'
    default:
      return '⚠️'
  }
}

/**
 * Write summary to GitHub Step Summary
 */
function writeSummary(
  eventType: string,
  version: string,
  status: string,
  scmSha: string,
  apiUrl: string,
  resourceId: string,
  environment?: string
): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    core.debug('GITHUB_STEP_SUMMARY not available, skipping summary')
    return
  }

  const hostname = getVersionerHostname(apiUrl)
  const statusEmoji = getStatusEmoji(status)

  let summary = '## 🚀 Versioner Summary\n\n'

  if (eventType === 'build') {
    const viewUrl = `${hostname}/manage/versions?view=${resourceId}`
    summary += `**Action:** Build\n\n`
    summary += `**Status:** ${statusEmoji} ${status}\n\n`
    summary += `**Version:** \`${version}\`\n\n`
    summary += `**Git SHA:** \`${scmSha}\`\n\n`
    summary += `[View in Versioner →](${viewUrl})\n`
  } else {
    const viewUrl = `${hostname}/deployments/${resourceId}`
    summary += `**Action:** Deployment\n\n`
    summary += `**Environment:** ${environment}\n\n`
    summary += `**Status:** ${statusEmoji} ${status}\n\n`
    summary += `**Version:** \`${version}\`\n\n`
    summary += `**Git SHA:** \`${scmSha}\`\n\n`
    summary += `[View in Versioner →](${viewUrl})\n`
  }

  try {
    fs.appendFileSync(summaryPath, summary)
    core.debug('Summary written to GITHUB_STEP_SUMMARY')
  } catch (error) {
    core.warning(
      `Failed to write summary: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

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
      // Build event payload
      const payload: BuildEventPayload = {
        product_name: productName,
        version: inputs.version,
        status: inputs.status,
        build_number: githubMetadata.build_number,
        build_url: githubMetadata.build_url,
        scm_repository: githubMetadata.scm_repository,
        scm_sha: githubMetadata.scm_sha,
        scm_branch: githubMetadata.scm_branch,
        source_system: githubMetadata.source_system,
        invoke_id: githubMetadata.invoke_id,
        built_by: githubMetadata.deployed_by,
        built_by_email: githubMetadata.deployed_by_email,
        built_by_name: githubMetadata.deployed_by_name,
        started_at: new Date().toISOString(),
        extra_metadata: inputs.metadata,
      }

      core.info('Sending build event to Versioner...')
      const response = await sendBuildEvent(
        inputs.apiUrl,
        inputs.apiKey,
        payload,
        inputs.failOnRejection
      )

      // Set outputs
      core.setOutput('build_id', response.id)
      core.setOutput('version_id', response.version_id)
      core.setOutput('product_id', response.product_id)

      // Success summary
      core.info('')
      core.info(`✅ Build tracked successfully!`)
      core.info(`   Build ID: ${response.id}`)
      core.info(`   Version ID: ${response.version_id}`)
      core.info(`   Product ID: ${response.product_id}`)

      // Create GitHub annotation for visibility
      core.notice(`Build tracked: ${productName}@${inputs.version} (${inputs.status})`)

      // Write to GitHub Step Summary
      writeSummary(
        'build',
        inputs.version,
        inputs.status,
        githubMetadata.scm_sha,
        inputs.apiUrl,
        response.version_id
      )
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
      const response = await sendDeploymentEvent(
        inputs.apiUrl,
        inputs.apiKey,
        payload,
        inputs.failOnRejection
      )

      // Set outputs
      core.setOutput('deployment_id', response.deployment_id)
      core.setOutput('event_id', response.event_id)
      core.setOutput('product_id', response.product_id)

      // Success summary
      core.info('')
      core.info(`✅ Deployment tracked successfully!`)
      core.info(`   Deployment ID: ${response.deployment_id}`)
      core.info(`   Event ID: ${response.event_id}`)

      // Create GitHub annotation for visibility
      core.notice(
        `Deployment tracked: ${productName}@${inputs.version} → ${inputs.environment} (${inputs.status})`
      )

      // Write to GitHub Step Summary
      writeSummary(
        'deployment',
        inputs.version,
        inputs.status,
        githubMetadata.scm_sha,
        inputs.apiUrl,
        response.deployment_id,
        inputs.environment
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
