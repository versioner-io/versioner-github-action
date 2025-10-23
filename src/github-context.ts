import * as github from '@actions/github'
import { GitHubMetadata } from './types'

/**
 * Extract GitHub context metadata for events
 */
export function getGitHubMetadata(): GitHubMetadata {
  const { context } = github
  const { repo, runId, runNumber, sha, actor, ref } = context

  // Construct build URL
  const buildUrl = `https://github.com/${repo.owner}/${repo.repo}/actions/runs/${runId}`

  // Extract branch name from ref (e.g., refs/heads/main -> main)
  const scmBranch = ref.startsWith('refs/heads/') ? ref.replace('refs/heads/', '') : ref

  return {
    scm_repository: `${repo.owner}/${repo.repo}`,
    scm_sha: sha,
    scm_branch: scmBranch,
    source_system: 'github',
    build_number: String(runNumber),
    invoke_id: String(runId),
    build_url: buildUrl,
    deployed_by: actor,
  }
}
