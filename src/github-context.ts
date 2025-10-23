import * as github from '@actions/github'
import { GitHubMetadata } from './types'

/**
 * Extract GitHub context metadata for deployment event
 */
export function getGitHubMetadata(): GitHubMetadata {
  const { context } = github
  const { repo, runId, runNumber, sha, actor } = context

  // Construct build URL
  const buildUrl = `https://github.com/${repo.owner}/${repo.repo}/actions/runs/${runId}`

  return {
    scm_repository: `${repo.owner}/${repo.repo}`,
    scm_sha: sha,
    source_system: 'github',
    build_number: String(runNumber),
    invoke_id: String(runId),
    build_url: buildUrl,
    deployed_by: actor,
  }
}
