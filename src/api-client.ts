import axios, { AxiosError } from 'axios'
import * as core from '@actions/core'
import { DeploymentEventPayload, DeploymentEventResponse } from './types'

/**
 * Send deployment event to Versioner API
 */
export async function sendDeploymentEvent(
  apiUrl: string,
  apiKey: string,
  payload: DeploymentEventPayload
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
        throw new Error(
          `API endpoint not found. Please check your api_url: ${apiUrl}`
        )
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
    throw new Error(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
