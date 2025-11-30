import { getGitHubMetadata, getAutoDetectedMetadata, mergeMetadata } from '../github-context'

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
      workflow_run_url: 'https://github.com/test-owner/test-repo/actions/runs/12345',
      deployed_by: 'test-user',
    })
  })

  it('should construct correct workflow run URL', () => {
    const metadata = getGitHubMetadata()

    expect(metadata.workflow_run_url).toBe(
      'https://github.com/test-owner/test-repo/actions/runs/12345'
    )
  })
})

describe('getAutoDetectedMetadata', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should extract all GitHub Actions environment variables with vi_gh_ prefix', () => {
    process.env.GITHUB_WORKFLOW = 'Deploy to Production'
    process.env.GITHUB_JOB = 'deploy'
    process.env.GITHUB_RUN_ATTEMPT = '1'
    process.env.GITHUB_EVENT_NAME = 'push'
    process.env.GITHUB_REF = 'refs/heads/main'
    process.env.GITHUB_HEAD_REF = ''
    process.env.GITHUB_BASE_REF = ''

    const metadata = getAutoDetectedMetadata()

    expect(metadata).toEqual({
      vi_gh_workflow: 'Deploy to Production',
      vi_gh_job: 'deploy',
      vi_gh_run_attempt: '1',
      vi_gh_event_name: 'push',
      vi_gh_ref: 'refs/heads/main',
    })
  })

  it('should include PR-specific fields when available', () => {
    process.env.GITHUB_WORKFLOW = 'PR Check'
    process.env.GITHUB_JOB = 'test'
    process.env.GITHUB_RUN_ATTEMPT = '2'
    process.env.GITHUB_EVENT_NAME = 'pull_request'
    process.env.GITHUB_REF = 'refs/pull/123/merge'
    process.env.GITHUB_HEAD_REF = 'feature-branch'
    process.env.GITHUB_BASE_REF = 'main'

    const metadata = getAutoDetectedMetadata()

    expect(metadata).toEqual({
      vi_gh_workflow: 'PR Check',
      vi_gh_job: 'test',
      vi_gh_run_attempt: '2',
      vi_gh_event_name: 'pull_request',
      vi_gh_ref: 'refs/pull/123/merge',
      vi_gh_head_ref: 'feature-branch',
      vi_gh_base_ref: 'main',
    })
  })

  it('should only include fields that exist (graceful handling)', () => {
    // Clear all GitHub env vars first
    delete process.env.GITHUB_WORKFLOW
    delete process.env.GITHUB_JOB
    delete process.env.GITHUB_RUN_ATTEMPT
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_HEAD_REF
    delete process.env.GITHUB_BASE_REF

    // Set only specific fields
    process.env.GITHUB_WORKFLOW = 'Build'
    process.env.GITHUB_JOB = 'compile'

    const metadata = getAutoDetectedMetadata()

    expect(metadata).toEqual({
      vi_gh_workflow: 'Build',
      vi_gh_job: 'compile',
    })
    expect(metadata).not.toHaveProperty('vi_gh_run_attempt')
    expect(metadata).not.toHaveProperty('vi_gh_event_name')
  })

  it('should return empty object when no GitHub env vars are set', () => {
    // Clear all GitHub env vars
    delete process.env.GITHUB_WORKFLOW
    delete process.env.GITHUB_JOB
    delete process.env.GITHUB_RUN_ATTEMPT
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_HEAD_REF
    delete process.env.GITHUB_BASE_REF

    const metadata = getAutoDetectedMetadata()

    expect(metadata).toEqual({})
  })

  it('should not include empty string values', () => {
    // Clear all GitHub env vars first
    delete process.env.GITHUB_WORKFLOW
    delete process.env.GITHUB_JOB
    delete process.env.GITHUB_RUN_ATTEMPT
    delete process.env.GITHUB_EVENT_NAME
    delete process.env.GITHUB_REF
    delete process.env.GITHUB_HEAD_REF
    delete process.env.GITHUB_BASE_REF

    // Set specific fields with some empty
    process.env.GITHUB_WORKFLOW = 'Test'
    process.env.GITHUB_JOB = ''
    process.env.GITHUB_RUN_ATTEMPT = '1'

    const metadata = getAutoDetectedMetadata()

    expect(metadata).toEqual({
      vi_gh_workflow: 'Test',
      vi_gh_run_attempt: '1',
    })
    expect(metadata).not.toHaveProperty('vi_gh_job')
  })
})

describe('mergeMetadata', () => {
  it('should merge auto-detected and user-provided metadata', () => {
    const autoDetected = {
      vi_gh_workflow: 'Deploy',
      vi_gh_job: 'deploy',
    }
    const userProvided = {
      docker_image: 'myapp:1.2.3',
      region: 'us-east-1',
    }

    const merged = mergeMetadata(autoDetected, userProvided)

    expect(merged).toEqual({
      vi_gh_workflow: 'Deploy',
      vi_gh_job: 'deploy',
      docker_image: 'myapp:1.2.3',
      region: 'us-east-1',
    })
  })

  it('should give precedence to user-provided values on conflicts', () => {
    const autoDetected = {
      vi_gh_workflow: 'Deploy',
      custom_field: 'auto-value',
    }
    const userProvided = {
      custom_field: 'user-value',
      another_field: 'test',
    }

    const merged = mergeMetadata(autoDetected, userProvided)

    expect(merged).toEqual({
      vi_gh_workflow: 'Deploy',
      custom_field: 'user-value', // User value wins
      another_field: 'test',
    })
  })

  it('should return empty object when both inputs are empty', () => {
    const merged = mergeMetadata({}, {})

    expect(merged).toEqual({})
  })

  it('should return auto-detected when user-provided is empty', () => {
    const autoDetected = {
      vi_gh_workflow: 'Deploy',
      vi_gh_job: 'deploy',
    }

    const merged = mergeMetadata(autoDetected, {})

    expect(merged).toEqual(autoDetected)
  })

  it('should return user-provided when auto-detected is empty', () => {
    const userProvided = {
      docker_image: 'myapp:1.2.3',
      region: 'us-east-1',
    }

    const merged = mergeMetadata({}, userProvided)

    expect(merged).toEqual(userProvided)
  })

  it('should handle complex nested values', () => {
    const autoDetected = {
      vi_gh_workflow: 'Deploy',
    }
    const userProvided = {
      deployment_config: {
        replicas: 3,
        strategy: 'rolling',
      },
      tags: ['production', 'v1.2.3'],
    }

    const merged = mergeMetadata(autoDetected, userProvided)

    expect(merged).toEqual({
      vi_gh_workflow: 'Deploy',
      deployment_config: {
        replicas: 3,
        strategy: 'rolling',
      },
      tags: ['production', 'v1.2.3'],
    })
  })
})
