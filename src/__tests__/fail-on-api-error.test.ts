/**
 * Tests for fail_on_api_error parameter
 */

import * as core from '@actions/core'
import axios from 'axios'
import { sendDeploymentEvent, sendBuildEvent } from '../api-client'
import { DeploymentEventPayload, BuildEventPayload } from '../types'

jest.mock('@actions/core')
jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedCore = core as jest.Mocked<typeof core>

describe('fail_on_api_error parameter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock axios.isAxiosError to return true for our test errors
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
  })

  describe('sendDeploymentEvent', () => {
    const payload: DeploymentEventPayload = {
      product_name: 'test-product',
      version: '1.0.0',
      environment_name: 'production',
      status: 'success',
    }

    it('should throw on API error when fail_on_api_error is true (default)', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      })

      await expect(
        sendDeploymentEvent('https://api.versioner.io', 'test-key', payload, true)
      ).rejects.toThrow('Authentication failed')
    })

    it('should not throw on API error when fail_on_api_error is false', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: {} },
        message: 'Unauthorized',
      })

      const result = await sendDeploymentEvent(
        'https://api.versioner.io',
        'test-key',
        payload,
        false
      )

      expect(result.status).toBe('not_recorded')
      expect(mockedCore.warning).toHaveBeenCalledWith(
        expect.stringContaining('Authentication failed')
      )
      expect(mockedCore.info).toHaveBeenCalledWith(
        'Continuing workflow (fail_on_api_error is false)'
      )
    })

    it('should always throw on preflight rejection (409) regardless of fail_on_api_error', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            detail: {
              message: 'Deployment in progress',
              code: 'DEPLOYMENT_IN_PROGRESS',
            },
          },
        },
      })

      await expect(
        sendDeploymentEvent('https://api.versioner.io', 'test-key', payload, false)
      ).rejects.toThrow('Deployment Conflict')
    })

    it('should always throw on preflight rejection (423) regardless of fail_on_api_error', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 423,
          data: {
            detail: {
              message: 'No-deploy window active',
              code: 'NO_DEPLOY_WINDOW',
              details: { rule_name: 'Friday freeze' },
            },
          },
        },
      })

      await expect(
        sendDeploymentEvent('https://api.versioner.io', 'test-key', payload, false)
      ).rejects.toThrow('Deployment Blocked by Schedule')
    })

    it('should always throw on preflight rejection (428) regardless of fail_on_api_error', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 428,
          data: {
            detail: {
              message: 'Flow violation',
              code: 'FLOW_VIOLATION',
              details: { rule_name: 'Staging required' },
            },
          },
        },
      })

      await expect(
        sendDeploymentEvent('https://api.versioner.io', 'test-key', payload, false)
      ).rejects.toThrow('Deployment Precondition Failed')
    })

    it('should handle connection refused when fail_on_api_error is false', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        code: 'ECONNREFUSED',
        message: 'Connection refused',
      })

      const result = await sendDeploymentEvent(
        'https://api.versioner.io',
        'test-key',
        payload,
        false
      )

      expect(result.status).toBe('not_recorded')
      expect(mockedCore.warning).toHaveBeenCalledWith(expect.stringContaining('Connection refused'))
    })

    it('should handle timeout when fail_on_api_error is false', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        code: 'ETIMEDOUT',
        message: 'Timeout',
      })

      const result = await sendDeploymentEvent(
        'https://api.versioner.io',
        'test-key',
        payload,
        false
      )

      expect(result.status).toBe('not_recorded')
      expect(mockedCore.warning).toHaveBeenCalledWith(expect.stringContaining('timeout'))
    })
  })

  describe('sendBuildEvent', () => {
    const payload: BuildEventPayload = {
      product_name: 'test-product',
      version: '1.0.0',
      status: 'success',
    }

    it('should throw on API error when fail_on_api_error is true (default)', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 403, data: {} },
        message: 'Forbidden',
      })

      await expect(
        sendBuildEvent('https://api.versioner.io', 'test-key', payload, true)
      ).rejects.toThrow('Authorization failed')
    })

    it('should not throw on API error when fail_on_api_error is false', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 404, data: {} },
        message: 'Not found',
      })

      const result = await sendBuildEvent('https://api.versioner.io', 'test-key', payload, false)

      expect(result.status).toBe('not_recorded')
      expect(mockedCore.warning).toHaveBeenCalledWith(
        expect.stringContaining('API endpoint not found')
      )
    })

    it('should always throw on preflight rejection regardless of fail_on_api_error', async () => {
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Build rejected' },
        },
      })

      await expect(
        sendBuildEvent('https://api.versioner.io', 'test-key', payload, false)
      ).rejects.toThrow('Build rejected')
    })
  })
})
