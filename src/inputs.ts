import * as core from '@actions/core'
import { ActionInputs } from './types'

/**
 * Get and validate action inputs
 */
export function getInputs(): ActionInputs {
  const apiUrl = core.getInput('api_url', { required: true })
  const apiKey = core.getInput('api_key', { required: true })
  const productName = core.getInput('product_name', { required: false }) || ''
  const version = core.getInput('version', { required: true })
  const environment = core.getInput('environment', { required: false }) || ''
  const eventType = core.getInput('event_type', { required: false }) || 'deployment'
  const status = core.getInput('status', { required: false }) || 'success'
  const metadataInput = core.getInput('metadata', { required: false }) || '{}'
  const failOnRejectionInput = core.getInput('fail_on_rejection', { required: false }) || 'false'

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

  // Validate status
  const validStatuses = ['success', 'failure', 'in_progress']
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: '${status}'. Must be one of: ${validStatuses.join(', ')}`)
  }

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
  }
}
