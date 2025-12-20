import * as core from '@actions/core'
import { getInputs } from '../inputs'

// Mock @actions/core
jest.mock('@actions/core')

describe('getInputs', () => {
  const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.VERSIONER_API_KEY
    delete process.env.VERSIONER_API_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return valid inputs with defaults', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
        status: '',
        metadata: '',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs).toEqual({
      apiUrl: 'https://api.versioner.io',
      apiKey: 'sk_test_key',
      productName: 'test-product',
      version: '1.0.0',
      environment: 'production',
      eventType: 'deployment',
      status: 'success',
      metadata: {},
      failOnApiError: true,
    })
  })

  it('should parse custom metadata', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
        status: 'success',
        metadata: '{"custom_field": "value", "number": 42}',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs.metadata).toEqual({
      custom_field: 'value',
      number: 42,
    })
  })

  it('should throw error for invalid API URL', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'not-a-url',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    expect(() => getInputs()).toThrow('Invalid api_url')
  })

  it('should throw error for invalid metadata JSON', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
        metadata: 'not-valid-json',
      }
      return inputs[name] || ''
    })

    expect(() => getInputs()).toThrow('Invalid metadata JSON')
  })

  it('should throw error for metadata array', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
        metadata: '["array", "not", "allowed"]',
      }
      return inputs[name] || ''
    })

    expect(() => getInputs()).toThrow('Metadata must be a JSON object')
  })

  it('should throw error when api_key is not provided', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: '',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    expect(() => getInputs()).toThrow('api_key is required')
  })

  it('should use VERSIONER_API_KEY environment variable when input not provided', () => {
    process.env.VERSIONER_API_KEY = 'sk_env_key'

    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.io',
        api_key: '',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs.apiKey).toBe('sk_env_key')
  })

  it('should use VERSIONER_API_URL environment variable when input not provided', () => {
    process.env.VERSIONER_API_URL = 'https://custom.api.url'

    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: '',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs.apiUrl).toBe('https://custom.api.url')
  })

  it('should prefer input over environment variable', () => {
    process.env.VERSIONER_API_KEY = 'sk_env_key'
    process.env.VERSIONER_API_URL = 'https://env.api.url'

    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://input.api.url',
        api_key: 'sk_input_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs.apiKey).toBe('sk_input_key')
    expect(inputs.apiUrl).toBe('https://input.api.url')
  })

  it('should default to https://api.versioner.io when no api_url provided', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: '',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
      }
      return inputs[name] || ''
    })

    const inputs = getInputs()

    expect(inputs.apiUrl).toBe('https://api.versioner.io')
  })
})
