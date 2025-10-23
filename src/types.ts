/**
 * Type definitions for Versioner API
 */

export interface DeploymentEventPayload {
  product_name: string
  version: string
  environment: string
  status: string
  scm_repository?: string
  scm_sha?: string
  source_system?: string
  build_number?: string
  invoke_id?: string
  build_url?: string
  deployed_by?: string
  extra_metadata?: Record<string, unknown>
}

export interface DeploymentEventResponse {
  deployment_id: string
  event_id: string
  product_id: string
  version_id: string
  environment_id: string
  status: string
  created_at: string
}

export interface ActionInputs {
  apiUrl: string
  apiKey: string
  productName: string
  version: string
  environment: string
  status: string
  metadata: Record<string, unknown>
}

export interface GitHubMetadata {
  scm_repository: string
  scm_sha: string
  source_system: string
  build_number: string
  invoke_id: string
  build_url: string
  deployed_by: string
}
