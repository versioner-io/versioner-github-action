/**
 * Type definitions for Versioner API
 */

export interface DeploymentEventPayload {
  product_name: string
  version: string
  environment_name?: string
  status: string
  scm_repository?: string
  scm_sha?: string
  source_system?: string
  build_number?: string
  invoke_id?: string
  deploy_url?: string
  deployed_by?: string
  deployed_by_email?: string
  deployed_by_name?: string
  completed_at?: string
  extra_metadata?: Record<string, unknown>
}

export interface BuildEventPayload {
  product_name: string
  version: string
  status?: string
  build_number?: string
  build_url?: string
  scm_repository?: string
  scm_sha?: string
  scm_branch?: string
  source_system?: string
  invoke_id?: string
  built_by?: string
  built_by_email?: string
  built_by_name?: string
  started_at?: string
  completed_at?: string
  error_message?: string
  error_code?: string
  extra_metadata?: Record<string, unknown>
}

export interface DeploymentEventResponse {
  id: string // Deployment ID (UUID)
  product_id: string
  product_name: string
  version_id: string
  version: string
  environment_id: string
  environment_name: string
  status: string
  deployed_at: string
  source_system?: string | null
  deployed_by?: string | null
  deployed_by_name?: string | null
  deployed_by_email?: string | null
  completed_at?: string | null
  deploy_url?: string | null
  extra_metadata?: Record<string, unknown> | null
  soak_time_hours?: number | null
}

export interface BuildEventResponse {
  id: string
  version_id: string
  product_id: string
  version: string
  build_number?: string
  status: string
  build_url?: string
  started_at: string
  completed_at?: string
}

export interface ActionInputs {
  apiUrl: string
  apiKey: string
  productName: string
  version: string
  environment: string
  eventType: string
  status: string
  metadata: Record<string, unknown>
  failOnApiError: boolean
}

export interface GitHubMetadata {
  scm_repository: string
  scm_sha: string
  scm_branch: string
  source_system: string
  build_number: string
  invoke_id: string
  workflow_run_url: string
  deployed_by: string
  deployed_by_email?: string
  deployed_by_name?: string
}
