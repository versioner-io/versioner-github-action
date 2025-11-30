import * as core from '@actions/core'
import { ActionInputs } from './types'

/**
 * Get and validate action inputs
 */
export function getInputs(): ActionInputs {
  const apiUrl =
    core.getInput('api_url', { required: false }) ||
    process.env.VERSIONER_API_URL ||
    'https://api.versioner.io'
  const apiKey =
    core.getInput('api_key', { required: false }) || process.env.VERSIONER_API_KEY || ''
  const productName = core.getInput('product_name', { required: false }) || ''
  const version = core.getInput('version', { required: true })
  const environment = core.getInput('environment', { required: false }) || ''
  const eventType = core.getInput('event_type', { required: false }) || 'deployment'
  const status = core.getInput('status', { required: false }) || 'success'
  const metadataInput = core.getInput('metadata', { required: false }) || '{}'
  const failOnRejectionInput = core.getInput('fail_on_rejection', { required: false }) || 'true'
  const skipPreflightChecksInput =
    core.getInput('skip_preflight_checks', { required: false }) || 'false'

  // Validate API key is provided
  if (!apiKey) {
    throw new Error(
      `api_key is required (provide via input or VERSIONER_API_KEY environment variable)`
    )
  }

  // Validate API URL format
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    throw new Error(`Invalid api_url: must start with http:// or https://`)
  }

  // Validate event_type
  const validEventTypes = ['build', 'deployment']
  if (!validEventTypes.includes(eventType)) {
    throw new Error(
      `Invalid event_type: '${eventType}'. Must be one of: ${validEventTypes.join(', ')}`
    )
  }

  // Note: Status validation is handled by the API, which accepts many values:
  // pending, queued, scheduled, started, in_progress, init, deploying/building,
  // success, completed, complete, finished, deployed/built,
  // failed, fail, failure, error, aborted, abort, cancelled, cancel, skipped

  // Validate environment is provided for deployment events
  if (eventType === 'deployment' && !environment) {
    throw new Error(`environment is required when event_type is 'deployment'`)
  }

  // Parse metadata JSON
  let metadata: Record<string, unknown> = {}
  try {
    metadata = JSON.parse(metadataInput)
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      throw new Error('Metadata must be a JSON object')
    }
  } catch (error) {
    throw new Error(
      `Invalid metadata JSON: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  // Parse fail_on_rejection boolean
  const failOnRejection = failOnRejectionInput.toLowerCase() === 'true'

  // Parse skip_preflight_checks boolean
  const skipPreflightChecks = skipPreflightChecksInput.toLowerCase() === 'true'

  return {
    apiUrl,
    apiKey,
    productName,
    version,
    environment,
    eventType,
    status,
    metadata,
    failOnRejection,
    skipPreflightChecks,
  }
}
