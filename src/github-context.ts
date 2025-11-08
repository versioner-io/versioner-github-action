import * as github from '@actions/github'
import { GitHubMetadata } from './types'

/**
 * Extract GitHub context metadata for events
 */
export function getGitHubMetadata(): GitHubMetadata {
  const { context } = github
  const { repo, runId, runNumber, sha, actor, ref, payload } = context

  // Construct build URL
  const buildUrl = `https://github.com/${repo.owner}/${repo.repo}/actions/runs/${runId}`

  // Extract branch name from ref (e.g., refs/heads/main -> main)
  const scmBranch = ref.startsWith('refs/heads/') ? ref.replace('refs/heads/', '') : ref

  // Try to get email and name from commit author (available in push events)
  const email = payload?.head_commit?.author?.email || payload?.commits?.[0]?.author?.email
  const name = payload?.head_commit?.author?.name || payload?.commits?.[0]?.author?.name

  return {
    scm_repository: `${repo.owner}/${repo.repo}`,
    scm_sha: sha,
    scm_branch: scmBranch,
    source_system: 'github',
    build_number: String(runNumber),
    invoke_id: String(runId),
    build_url: buildUrl,
    deployed_by: actor,
    deployed_by_email: email,
    deployed_by_name: name,
  }
}

/**
 * Extract auto-detected GitHub metadata with vi_gh_ prefix
 * Following ADR-013: Auto-Detected Extra Metadata
 */
export function getAutoDetectedMetadata(): Record<string, unknown> {
  const metadata: Record<string, unknown> = {}

  // Helper to add field only if value exists
  const addIfPresent = (key: string, value: string | undefined): void => {
    if (value && value !== '') {
      metadata[key] = value
    }
  }

  // GitHub Actions environment variables
  addIfPresent('vi_gh_workflow', process.env.GITHUB_WORKFLOW)
  addIfPresent('vi_gh_job', process.env.GITHUB_JOB)
  addIfPresent('vi_gh_run_attempt', process.env.GITHUB_RUN_ATTEMPT)
  addIfPresent('vi_gh_event_name', process.env.GITHUB_EVENT_NAME)
  addIfPresent('vi_gh_ref', process.env.GITHUB_REF)
  addIfPresent('vi_gh_head_ref', process.env.GITHUB_HEAD_REF)
  addIfPresent('vi_gh_base_ref', process.env.GITHUB_BASE_REF)

  return metadata
}

/**
 * Merge auto-detected metadata with user-provided metadata
 * User values take precedence over auto-detected values
 * Following ADR-013: Auto-Detected Extra Metadata
 */
export function mergeMetadata(
  autoDetected: Record<string, unknown>,
  userProvided: Record<string, unknown>
): Record<string, unknown> {
  // If both empty, return empty object
  if (Object.keys(autoDetected).length === 0 && Object.keys(userProvided).length === 0) {
    return {}
  }

  // Merge with user values taking precedence
  return {
    ...autoDetected,
    ...userProvided,
  }
}
