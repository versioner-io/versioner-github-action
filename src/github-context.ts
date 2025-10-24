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
