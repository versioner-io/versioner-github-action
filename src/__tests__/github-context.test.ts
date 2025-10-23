import { getGitHubMetadata } from '../github-context'

// Mock @actions/github
jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo',
    },
    runId: 12345,
    runNumber: 42,
    sha: 'abc123def456',
    actor: 'test-user',
    ref: 'refs/heads/main',
  },
}))

describe('getGitHubMetadata', () => {
  it('should extract GitHub context metadata', () => {
    const metadata = getGitHubMetadata()

    expect(metadata).toEqual({
      scm_repository: 'test-owner/test-repo',
      scm_sha: 'abc123def456',
      scm_branch: 'main',
      source_system: 'github',
      build_number: '42',
      invoke_id: '12345',
      build_url: 'https://github.com/test-owner/test-repo/actions/runs/12345',
      deployed_by: 'test-user',
    })
  })

  it('should construct correct build URL', () => {
    const metadata = getGitHubMetadata()

    expect(metadata.build_url).toBe('https://github.com/test-owner/test-repo/actions/runs/12345')
  })
})
