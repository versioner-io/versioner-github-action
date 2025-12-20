import axios, { AxiosError } from 'axios'
import * as core from '@actions/core'
import * as fs from 'fs'
import {
  DeploymentEventPayload,
  DeploymentEventResponse,
  BuildEventPayload,
  BuildEventResponse,
} from './types'

/**
 * Write error summary to GitHub Step Summary
 */
function writeErrorSummary(
  errorCode: string,
  message: string,
  ruleName: string,
  status: number,
  retryAfter?: string,
  details?: Record<string, unknown>
): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) {
    core.debug('GITHUB_STEP_SUMMARY not available, skipping error summary')
    return
  }

  let summary = '## ❌ Versioner Deployment Rejected\n\n'

  // Add status-specific emoji and title
  if (status === 409) {
    summary += '### ⚠️ Deployment Conflict\n\n'
  } else if (status === 423) {
    summary += '### 🔒 Deployment Blocked by Schedule\n\n'
  } else if (status === 428) {
    summary += '### ❌ Deployment Precondition Failed\n\n'
  }

  // Add key information
  summary += `- **Error Code:** \`${errorCode}\`\n`
  summary += `- **Rule:** ${ruleName}\n`
  summary += `- **Message:** ${message}\n`

  if (retryAfter) {
    summary += `- **Retry After:** \`${retryAfter}\`\n`
  }

  summary += '\n'

  // Add specific guidance based on error code
  if (status === 409) {
    summary += '**Action Required:**\n'
    summary += '- Wait for the current deployment to complete\n'
    summary += '- Retry this deployment\n'
  } else if (status === 423) {
    summary += '**Action Required:**\n'
    if (retryAfter) {
      summary += `- Wait until \`${retryAfter}\`\n`
      summary += '- Retry automatically after the no-deploy window\n'
    }
    summary += '- Or use \`skip-preflight-checks: true\` for emergencies\n'
  } else if (status === 428) {
    summary += '**Action Required:**\n'
    if (errorCode === 'FLOW_VIOLATION') {
      summary += '- Deploy to required environments first\n'
      summary += '- Then retry this deployment\n'
    } else if (errorCode === 'INSUFFICIENT_SOAK_TIME') {
      summary += '- Wait for the soak time requirement to be met\n'
      if (retryAfter) {
        summary += `- Can deploy at: \`${retryAfter}\`\n`
      }
      summary += '- Or use \`skip-preflight-checks: true\` for emergencies\n'
    } else if (errorCode === 'QUALITY_APPROVAL_REQUIRED' || errorCode === 'APPROVAL_REQUIRED') {
      summary += '- Obtain required approval via Versioner UI\n'
      summary += '- Then retry this deployment\n'
    } else {
      summary += '- Resolve the issue described above\n'
      summary += '- Then retry this deployment\n'
      summary += '- Or use \`skip-preflight-checks: true\` for emergencies\n'
    }
  }

  // Add details section if available
  if (details && Object.keys(details).length > 0) {
    summary += '\n**Details:**\n'
    summary += '```json\n'
    summary += JSON.stringify(details, null, 2)
    summary += '\n```\n'
  }

  try {
    fs.appendFileSync(summaryPath, summary)
    core.debug('Error summary written to GITHUB_STEP_SUMMARY')
  } catch (error) {
    core.warning(
      `Failed to write error summary: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Send deployment event to Versioner API
 */
export async function sendDeploymentEvent(
  apiUrl: string,
  apiKey: string,
  payload: DeploymentEventPayload,
  failOnApiError = true
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

    // Validate critical fields
    if (!response.data.id) {
      core.warning('⚠️ API response is missing id field')
      core.warning(`Response status: ${response.status}`)
      core.warning(`Response headers: ${JSON.stringify(response.headers)}`)
    }

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
          } else if (
            errorCode === 'QUALITY_APPROVAL_REQUIRED' ||
            errorCode === 'APPROVAL_REQUIRED'
          ) {
            rejectionError += `\n\nApproval required before deployment can proceed.`
            rejectionError += `\nObtain approval via Versioner UI, then retry.`
          } else {
            // Generic handler for unknown/future error codes
            rejectionError += `\n\nResolve the issue described above, then retry.`
          }

          // Always include full details for debugging (all error codes)
          if (detail?.details) {
            rejectionError += `\n\nDetails: ${JSON.stringify(detail.details, null, 2)}`
          }
        }

        // Write error summary to GitHub Step Summary
        writeErrorSummary(
          errorCode,
          message,
          ruleName,
          status,
          detail?.retry_after,
          detail?.details
        )

        // Preflight rejections always throw - policy enforcement is server-side
        throw new Error(rejectionError)
      }

      // Handle API errors (401, 403, 404, 422, timeouts, connection errors)
      let apiErrorMessage = ''

      if (status === 401) {
        apiErrorMessage = `Authentication failed: Invalid API key. Please check your VERSIONER_API_KEY secret.`
      } else if (status === 403) {
        apiErrorMessage = `Authorization failed: API key does not have permission to create deployment events.`
      } else if (status === 422) {
        const detail = data && typeof data === 'object' ? JSON.stringify(data) : String(data)
        apiErrorMessage = `Validation error: ${detail}`
      } else if (status === 404) {
        apiErrorMessage = `API endpoint not found. Please check your api_url: ${apiUrl}`
      } else if (axiosError.code === 'ECONNREFUSED') {
        apiErrorMessage = `Connection refused: Unable to connect to ${apiUrl}. Please check the API URL.`
      } else if (axiosError.code === 'ETIMEDOUT') {
        apiErrorMessage = `Request timeout: The API did not respond within 30 seconds. Please try again.`
      } else {
        const message = axiosError.message || 'Unknown error'
        const responseData = data ? `\nResponse: ${JSON.stringify(data)}` : ''
        apiErrorMessage = `Failed to send deployment event (HTTP ${status || 'unknown'}): ${message}${responseData}`
      }

      if (failOnApiError) {
        throw new Error(apiErrorMessage)
      } else {
        core.warning(`⚠️ ${apiErrorMessage}`)
        core.info('Continuing workflow (fail_on_api_error is false)')
        // Return a placeholder response when not failing
        return {
          id: '',
          product_id: '',
          product_name: '',
          version_id: '',
          version: '',
          environment_id: '',
          environment_name: '',
          status: 'not_recorded',
          deployed_at: new Date().toISOString(),
        }
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
  failOnApiError = true
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

        // Preflight rejections always throw - policy enforcement is server-side
        throw new Error(rejectionError)
      }

      // Handle API errors (401, 403, 404, 422, timeouts, connection errors)
      let apiErrorMessage = ''

      if (status === 401) {
        apiErrorMessage = `Authentication failed: Invalid API key. Please check your VERSIONER_API_KEY secret.`
      } else if (status === 403) {
        apiErrorMessage = `Authorization failed: API key does not have permission to create build events.`
      } else if (status === 422) {
        const detail = data && typeof data === 'object' ? JSON.stringify(data) : String(data)
        apiErrorMessage = `Validation error: ${detail}`
      } else if (status === 404) {
        apiErrorMessage = `API endpoint not found. Please check your api_url: ${apiUrl}`
      } else if (axiosError.code === 'ECONNREFUSED') {
        apiErrorMessage = `Connection refused: Unable to connect to ${apiUrl}. Please check the API URL.`
      } else if (axiosError.code === 'ETIMEDOUT') {
        apiErrorMessage = `Request timeout: The API did not respond within 30 seconds. Please try again.`
      } else {
        const message = axiosError.message || 'Unknown error'
        const responseData = data ? `\nResponse: ${JSON.stringify(data)}` : ''
        apiErrorMessage = `Failed to send build event (HTTP ${status || 'unknown'}): ${message}${responseData}`
      }

      if (failOnApiError) {
        throw new Error(apiErrorMessage)
      } else {
        core.warning(`⚠️ ${apiErrorMessage}`)
        core.info('Continuing workflow (fail_on_api_error is false)')
        // Return a placeholder response when not failing
        return {
          id: '',
          version_id: '',
          product_id: '',
          version: payload.version,
          status: 'not_recorded',
          started_at: new Date().toISOString(),
        }
      }
    }

    // Non-axios errors
    throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
  }
}
