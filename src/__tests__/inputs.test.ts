import * as core from '@actions/core'
import { getInputs } from '../inputs'

// Mock @actions/core
jest.mock('@actions/core')

describe('getInputs', () => {
  const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return valid inputs with defaults', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.dev',
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
      apiUrl: 'https://api.versioner.dev',
      apiKey: 'sk_test_key',
      productName: 'test-product',
      version: '1.0.0',
      environment: 'production',
      status: 'success',
      metadata: {},
    })
  })

  it('should parse custom metadata', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.dev',
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

  it('should throw error for invalid status', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.dev',
        api_key: 'sk_test_key',
        product_name: 'test-product',
        version: '1.0.0',
        environment: 'production',
        status: 'invalid-status',
      }
      return inputs[name] || ''
    })

    expect(() => getInputs()).toThrow('Invalid status')
  })

  it('should throw error for invalid metadata JSON', () => {
    mockGetInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        api_url: 'https://api.versioner.dev',
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
        api_url: 'https://api.versioner.dev',
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
})
