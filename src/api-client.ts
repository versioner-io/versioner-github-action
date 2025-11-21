import axios, { AxiosError } from 'axios'
import * as core from '@actions/core'
import {
  DeploymentEventPayload,
  DeploymentEventResponse,
  BuildEventPayload,
  BuildEventResponse,
} from './types'

/**
 * Send deployment event to Versioner API
 */
export async function sendDeploymentEvent(
  apiUrl: string,
  apiKey: string,
  payload: DeploymentEventPayload,
  failOnRejection = false
): Promise<DeploymentEventResponse> {
  const endpoint = `${apiUrl.replace(/\/$/, '')}/deployment-events/`

  core.info(`Sending deployment event to ${endpoint}`)
  core.debug(`Payload: ${JSON.stringify(payload, null, 2)}`)

  try {
    const response = await axios.post<DeploymentEventResponse>(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000, // 30 second timeout
    })

    core.info(`✅ Deployment event created successfully`)
    core.debug(`Response: ${JSON.stringify(response.data, null, 2)}`)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status
      const data = axiosError.response?.data

      // Handle rejection status codes (409, 423, 428)
      if (status === 409 || status === 423 || status === 428) {
        const errorResponse = data as {
          detail?: {
            error?: string
            message?: string
            code?: string
            details?: {
              rule_name?: string
              [key: string]: unknown
            }
            retry_after?: string
          }
        }

        const detail = errorResponse?.detail
        const errorCode = detail?.code || 'UNKNOWN'
        const message = detail?.message || 'Deployment rejected by Versioner'
        const ruleName = detail?.details?.rule_name || 'Unknown Rule'

        let rejectionError = ''

        // Format error based on status code
        if (status === 409) {
          // DEPLOYMENT_IN_PROGRESS
          rejectionError = `⚠️ Deployment Conflict\n\n`
          rejectionError += `${message}\n`
          rejectionError += `Another deployment is in progress. Please wait and retry.`
        } else if (status === 423) {
          // NO_DEPLOY_WINDOW
          rejectionError = `🔒 Deployment Blocked by Schedule\n\n`
          rejectionError += `Rule: ${ruleName}\n`
          rejectionError += `${message}\n`
          if (detail?.retry_after) {
            rejectionError += `\nRetry after: ${detail.retry_after}`
          }
          rejectionError += `\n\nTo skip checks (emergency only), add to your workflow:\n`
          rejectionError += `  skip-preflight-checks: true`
        } else if (status === 428) {
          // Precondition failures (FLOW_VIOLATION, INSUFFICIENT_SOAK_TIME, etc.)
          rejectionError = `❌ Deployment Precondition Failed\n\n`
          rejectionError += `Error: ${errorCode}\n`
          rejectionError += `Rule: ${ruleName}\n`
          rejectionError += `${message}\n`

          if (detail?.retry_after) {
            rejectionError += `\nRetry after: ${detail.retry_after}`
          }

          // Add specific guidance based on error code
          if (errorCode === 'FLOW_VIOLATION') {
            rejectionError += `\n\nDeploy to required environments first, then retry.`
          } else if (errorCode === 'INSUFFICIENT_SOAK_TIME') {
            rejectionError += `\n\nWait for soak time to complete, then retry.`
            rejectionError += `\n\nTo skip checks (emergency only), add to your workflow:\n`
            rejectionError += `  skip-preflight-checks: true`
          } else if (
            errorCode === 'QUALITY_APPROVAL_REQUIRED' ||
            errorCode === 'APPROVAL_REQUIRED'
          ) {
            rejectionError += `\n\nApproval required before deployment can proceed.`
            rejectionError += `\nObtain approval via Versioner UI, then retry.`
          } else {
            // Generic handler for unknown/future error codes
            rejectionError += `\n\nResolve the issue described above, then retry.`
            rejectionError += `\n\nTo skip checks (emergency only), add to your workflow:\n`
            rejectionError += `  skip-preflight-checks: true`
          }

          // Always include full details for debugging (all error codes)
          if (detail?.details) {
            rejectionError += `\n\nDetails: ${JSON.stringify(detail.details, null, 2)}`
          }
        }

        if (failOnRejection) {
          throw new Error(rejectionError)
        } else {
          core.warning(`⚠️ ${rejectionError}`)
          core.info('Continuing workflow (fail_on_rejection is false)')
          // Return a placeholder response when not failing
          return {
            deployment_id: '',
            event_id: '',
            product_id: '',
            version_id: '',
            environment_id: '',
            status: 'rejected',
            created_at: new Date().toISOString(),
          }
        }
      }

      // Provide detailed error messages
      if (status === 401) {
        throw new Error(
          `Authentication failed: Invalid API key. Please check your VERSIONER_API_KEY secret.`
        )
      } else if (status === 403) {
        throw new Error(
          `Authorization failed: API key does not have permission to create deployment events.`
        )
      } else if (status === 422) {
        const detail = data && typeof data === 'object' ? JSON.stringify(data) : String(data)
        throw new Error(`Validation error: ${detail}`)
      } else if (status === 404) {
        throw new Error(`API endpoint not found. Please check your api_url: ${apiUrl}`)
      } else if (axiosError.code === 'ECONNREFUSED') {
        throw new Error(
          `Connection refused: Unable to connect to ${apiUrl}. Please check the API URL.`
        )
      } else if (axiosError.code === 'ETIMEDOUT') {
        throw new Error(
          `Request timeout: The API did not respond within 30 seconds. Please try again.`
        )
      } else {
        const message = axiosError.message || 'Unknown error'
        const responseData = data ? `\nResponse: ${JSON.stringify(data)}` : ''
        throw new Error(
          `Failed to send deployment event (HTTP ${status || 'unknown'}): ${message}${responseData}`
        )
      }
    }

    // Non-axios errors
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Send build event to Versioner API
 */
export async function sendBuildEvent(
  apiUrl: string,
  apiKey: string,
  payload: BuildEventPayload,
  failOnRejection = false
): Promise<BuildEventResponse> {
  const endpoint = `${apiUrl.replace(/\/$/, '')}/build-events/`

  core.info(`Sending build event to ${endpoint}`)
  core.debug(`Payload: ${JSON.stringify(payload, null, 2)}`)

  try {
    const response = await axios.post<BuildEventResponse>(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30000, // 30 second timeout
    })

    core.info(`✅ Build event created successfully`)
    core.debug(`Response: ${JSON.stringify(response.data, null, 2)}`)

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status
      const data = axiosError.response?.data

      // Handle rejection status codes (409, 423, 428)
      if (status === 409 || status === 423 || status === 428) {
        const errorData = data as { message?: string; error?: string } | undefined
        const message = errorData?.message || errorData?.error || 'Build rejected by Versioner'
        const rejectionError = `Build rejected: ${message}`

        if (failOnRejection) {
          throw new Error(rejectionError)
        } else {
          core.warning(`⚠️ ${rejectionError}`)
          core.info('Continuing workflow (fail_on_rejection is false)')
          // Return a placeholder response when not failing
          return {
            id: '',
            version_id: '',
            product_id: '',
            version: payload.version,
            status: 'rejected',
            started_at: new Date().toISOString(),
          }
        }
      }

      // Provide detailed error messages
      if (status === 401) {
        throw new Error(
          `Authentication failed: Invalid API key. Please check your VERSIONER_API_KEY secret.`
        )
      } else if (status === 403) {
        throw new Error(
          `Authorization failed: API key does not have permission to create build events.`
        )
      } else if (status === 422) {
        const detail = data && typeof data === 'object' ? JSON.stringify(data) : String(data)
        throw new Error(`Validation error: ${detail}`)
      } else if (status === 404) {
        throw new Error(`API endpoint not found. Please check your api_url: ${apiUrl}`)
      } else if (axiosError.code === 'ECONNREFUSED') {
        throw new Error(
          `Connection refused: Unable to connect to ${apiUrl}. Please check the API URL.`
        )
      } else if (axiosError.code === 'ETIMEDOUT') {
        throw new Error(
          `Request timeout: The API did not respond within 30 seconds. Please try again.`
        )
      } else {
        const message = axiosError.message || 'Unknown error'
        const responseData = data ? `\nResponse: ${JSON.stringify(data)}` : ''
        throw new Error(
          `Failed to send build event (HTTP ${status || 'unknown'}): ${message}${responseData}`
        )
      }
    }

    // Non-axios errors
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
  }
}
