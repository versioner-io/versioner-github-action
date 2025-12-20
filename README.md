# Versioner GitHub Action

A GitHub Action for reporting deployment events to [Versioner](https://github.com/versioner-io/versioner), a deployment tracking and visibility system.

## 📌 What is Versioner?

**Versioner** is a deployment tracking and visibility system designed to help engineering teams:

- **Detect drift** across environments - know exactly what's deployed where
- **Reduce deployment confusion** - maintain a shared view of deployment state
- **Improve auditability** - track who deployed what, when, and from where
- **Streamline approvals** - integrate deployment tracking into your release pipeline

Versioner captures deployment events from your CI/CD pipelines and provides:
- REST API for querying deployment history
- Slack app for chat-native deployment queries
- Multi-environment tracking with automatic drift detection
- Full audit trail with SCM integration

## 🚀 Quick Start

Get started in 5 minutes:

### 1. Get API Credentials

1. Sign up at [versioner.io](https://versioner.io)
2. Create an API key in your account settings
3. Note your API endpoint (e.g., `https://api.versioner.io`)

### 2. Add GitHub Secret

Go to your repository → **Settings** → **Secrets and variables** → **Actions**

Add secret:
- `VERSIONER_API_KEY` - Your API key

### 3. Add to Your Workflow

Create or update `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy application
        run: ./deploy.sh production

      - name: Track deployment in Versioner
        uses: versioner-io/versioner-github-action@v1
        with:
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-api-service
          version: ${{ github.sha }}
          environment: production
```

### 4. Push and Deploy

```bash
git add .github/workflows/deploy.yml
git commit -m "Add Versioner tracking"
git push origin main
```

Check the **Actions** tab to see your deployment tracked!

## 📝 Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api_url` | ❌ | `https://api.versioner.io` | Versioner API endpoint (can also use `VERSIONER_API_URL` env var) |
| `api_key` | ✅* | - | Versioner API key (can also use `VERSIONER_API_KEY` env var, store in GitHub Secrets) |
| `product_name` | ❌ | repo name | Name of the product/service (defaults to repository name) |
| `version` | ✅ | - | Version identifier (e.g., git SHA, semantic version, build number) |
| `environment` | ❌ | - | Target environment (required for deployment events, optional for build events) |
| `event_type` | ❌ | `deployment` | Event type: `build` or `deployment` |
| `status` | ❌ | `success` | Event status (`success`, `failure`, `in_progress`) |
| `metadata` | ❌ | `{}` | Additional JSON metadata to attach to the event |
| `fail_on_api_error` | ❌ | `true` | Fail the workflow if Versioner API has connectivity or authentication errors. Preflight check rejections (409, 423, 428) always fail regardless of this setting. |

\* Required unless provided via `VERSIONER_API_KEY` environment variable

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `deployment_id` | UUID of the created deployment record (deployment events only) |
| `event_id` | UUID of the deployment event (deployment events only) |
| `build_id` | UUID of the created build record (build events only) |
| `version_id` | UUID of the version record (all events) |
| `product_id` | UUID of the product (all events) |

## 🛡️ Preflight Checks

When starting a deployment (`status: started`), Versioner automatically runs preflight checks to validate:
- **No concurrent deployments** - Prevents multiple simultaneous deployments to the same environment
- **No active no-deploy windows** - Respects scheduled freeze periods (e.g., Friday afternoons, holidays)
- **Required approvals obtained** - Ensures proper authorization before deployment
- **Flow/soak time requirements met** - Validates promotion path and minimum soak time in lower environments

If checks fail, the action will fail and the deployment will **NOT** be created.

### Default Behavior

Preflight checks run automatically by default:

```yaml
- name: Deploy to production
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ github.sha }}
    environment: production
    status: started  # Checks run automatically
```

### Skip Checks (Emergency Only)

For emergency hotfixes, admins can temporarily disable or set rules to "Report Only" mode in the Versioner UI. This provides centralized control without requiring code changes:

1. Log into Versioner UI
2. Navigate to Deployment Rules
3. Change rule status from "Enabled" to "Report Only" or "Disabled"
4. Deploy normally - rules won't block
5. After emergency, flip rules back to "Enabled"

**Benefits of server-side control:**
- No code changes required
- Instant effect across all deployments
- Granular control (disable specific rules, not all)
- Auditable (status changes tracked)
- Easy to reverse

### Error Messages

When preflight checks fail, you'll see detailed error messages:

**Schedule Block (423):**
```
🔒 Deployment Blocked by Schedule

Rule: Production Freeze - Friday Afternoons
Deployment blocked by no-deploy window

Retry after: 2025-11-21T18:00:00-08:00
```

**Flow Violation (428):**
```
❌ Deployment Precondition Failed

Error: FLOW_VIOLATION
Rule: Staging Required Before Production
Version must be deployed to staging first

Deploy to required environments first, then retry.
```

**Insufficient Soak Time (428):**
```
❌ Deployment Precondition Failed

Error: INSUFFICIENT_SOAK_TIME
Rule: 24hr Staging Soak
Version must soak in staging for at least 24 hours

Retry after: 2025-11-22T10:00:00Z

Wait for soak time to complete, then retry.
```

## 🔧 Usage Examples

### Using Environment Variables (Recommended for Multiple Events)

Set `VERSIONER_API_KEY` once at the job or workflow level to avoid repeating it:

```yaml
env:
  VERSIONER_API_KEY: ${{ secrets.VERSIONER_API_KEY }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Build start
        uses: versioner-io/versioner-github-action@v1
        with:
          version: ${{ github.sha }}
          event_type: build
          status: in_progress

      - name: Build application
        run: npm run build

      - name: Build complete
        uses: versioner-io/versioner-github-action@v1
        with:
          version: ${{ github.sha }}
          event_type: build
          status: success

      - name: Deploy start
        uses: versioner-io/versioner-github-action@v1
        with:
          version: ${{ github.sha }}
          environment: production
          status: in_progress

      - name: Deploy application
        run: ./deploy.sh production

      - name: Deploy complete
        uses: versioner-io/versioner-github-action@v1
        with:
          version: ${{ github.sha }}
          environment: production
          status: success
```

### Track a Build (No Deployment)

```yaml
- name: Track build
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    version: ${{ github.sha }}
    event_type: build   # No environment needed - just tracking the build!
```

### Track a Deployment

```yaml
- name: Report deployment
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ github.sha }}
    environment: production
    event_type: deployment
```

### With Semantic Versioning

```yaml
- name: Extract version from tag
  id: version
  run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

- name: Report deployment
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ steps.version.outputs.VERSION }}
    environment: production
```

### With Custom Metadata

```yaml
- name: Report deployment with metadata
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ github.sha }}
    environment: production
    metadata: |
      {
        "duration_seconds": 120,
        "deployment_type": "blue-green",
        "region": "us-east-1"
      }
```

### Report Deployment Failure

```yaml
- name: Deploy application
  id: deploy
  run: ./deploy.sh production
  continue-on-error: true

- name: Report deployment status
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ github.sha }}
    environment: production
    status: ${{ steps.deploy.outcome }}
```

### Best-Effort Observability

Allow deployments to proceed even if Versioner API is unavailable:

```yaml
- name: Deploy to production
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    version: ${{ github.sha }}
    environment: production
    fail_on_api_error: false  # Don't block deployment if Versioner is down
```

**Note:** Preflight check rejections (409, 423, 428) always fail the workflow. Policy enforcement is controlled server-side via rule status (enabled, report_only, disabled) in the Versioner UI.

### Multi-Environment Deployment

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh staging
      - uses: versioner-io/versioner-github-action@v1
        with:
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh production
      - uses: versioner-io/versioner-github-action@v1
        with:
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
```

## 🔐 Setting Up Secrets

1. **Get your Versioner API key:**
   - Sign up at [versioner.io](https://versioner.io)
   - Create an API key in your account settings
   - Note your API endpoint URL

2. **Add secret to your GitHub repository:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add `VERSIONER_API_KEY` with your API key
   - (Optional) Add `VERSIONER_API_URL` to override the default `https://api.versioner.io`

## 🤖 Auto-Populated Metadata

The action automatically includes the following metadata from the GitHub context:

### Core Fields (Top-Level)
- `scm_repository` - Repository name (e.g., `owner/repo`)
- `scm_sha` - Git commit SHA
- `scm_branch` - Branch name (e.g., `main`)
- `source_system` - Always set to `"github"`
- `build_number` - GitHub Actions run number
- `invoke_id` - GitHub Actions run ID
- `deploy_url` - Link to the GitHub Actions workflow run (for deployment events)
- `build_url` - Link to the GitHub Actions workflow run (for build events)
- `deployed_by` / `built_by` - GitHub username who triggered the workflow
- `deployed_by_email` / `built_by_email` - Email from commit author (when available)
- `deployed_by_name` / `built_by_name` - Full name from commit author (when available)
- `started_at` / `completed_at` - Timestamp when the action runs

**Note:** Email and name fields are extracted from commit metadata and are only available for `push` events. For `workflow_dispatch` (manual triggers) or other event types, these fields will be `null`.

### Extra Metadata (Automatic)

The action automatically captures additional GitHub Actions context in the `extra_metadata` field with a `vi_gh_` prefix (Versioner Internal - GitHub). These fields are merged with any user-provided metadata, with **user values taking precedence**.

**Auto-detected fields:**
- `vi_gh_workflow` - Workflow name (e.g., `"Deploy to Production"`)
- `vi_gh_job` - Job name (e.g., `"deploy"`)
- `vi_gh_run_attempt` - Retry attempt number (e.g., `"1"`)
- `vi_gh_event_name` - Trigger event (e.g., `"push"`, `"pull_request"`, `"workflow_dispatch"`)
- `vi_gh_ref` - Git reference (e.g., `"refs/heads/main"`)
- `vi_gh_head_ref` - PR head branch (only for pull requests)
- `vi_gh_base_ref` - PR base branch (only for pull requests)

**Example resulting metadata:**
```json
{
  "vi_gh_workflow": "Deploy to Production",
  "vi_gh_job": "deploy",
  "vi_gh_run_attempt": "1",
  "vi_gh_event_name": "push",
  "vi_gh_ref": "refs/heads/main",
  "docker_image": "myapp:1.2.3",
  "region": "us-east-1"
}
```

**Note:** Only fields that exist in the environment are included. The `vi_` prefix is reserved for Versioner-managed metadata.

## 🏗️ How It Works

1. **Validates inputs** - Ensures all required fields are provided
2. **Enriches metadata** - Adds GitHub context automatically
3. **Calls Versioner API** - POSTs to `/build-events/` or `/deployment-events/` endpoint
4. **Handles errors** - Provides clear error messages and GitHub annotations
5. **Outputs IDs** - Returns build/deployment and event IDs for downstream steps

The action uses Versioner's natural key-based API, which means:
- Products, versions, and environments are **created automatically** if they don't exist
- Environment types are **inferred** from names (e.g., `production` → `production`, `staging` → `staging`)
- No pre-configuration required - just start sending events!

## 📊 What Gets Tracked

Each deployment event creates records in Versioner for:

- **Product** - The service/application being deployed
- **Version** - The specific version deployed (git SHA, tag, etc.)
- **Environment** - Where it was deployed (production, staging, etc.)
- **Deployment** - The deployment record linking version to environment
- **Event** - The deployment event with full metadata and audit trail

## 🔗 Integration with Versioner Ecosystem

This GitHub Action is part of the Versioner ecosystem:

- **[Versioner API](https://github.com/versioner-io/versioner-api)** - Core REST API for deployment tracking
- **[Versioner GitHub Action](https://github.com/versioner-io/versioner-github-action)** - This action (for GitHub workflows)
- **Versioner Python SDK** - Coming soon (for non-GitHub CI/CD systems)
- **Versioner Slack App** - Coming soon (chat-native deployment queries)

## 🛠️ Development

This action is built with TypeScript and uses:
- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub context and API
- `axios` - HTTP client for API calls

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🔍 Troubleshooting

### Email/Name Fields Are Null

**Problem:** `deployed_by_email` and `deployed_by_name` are showing as `null` in the API.

**Solution:** These fields are only populated for `push` events. If you're using `workflow_dispatch` (manual trigger) or other event types, commit metadata isn't available. To get email/name data:
- Trigger the workflow via a push to a branch
- Or use `pull_request` events which include commit data

### Authentication Failed

**Problem:** `Authentication failed: Invalid API key`

**Solution:**
1. Verify your API key is correct in Versioner account settings
2. Ensure the secret is named exactly `VERSIONER_API_KEY` in GitHub
3. Check that you're using `${{ secrets.VERSIONER_API_KEY }}` in the workflow

### API Endpoint Not Found

**Problem:** `API endpoint not found. Please check your api_url`

**Solution:**
1. If using default: No action needed, it should work automatically
2. If using custom `api_url`: Verify the URL is correct (should be `https://api.versioner.io` or `https://api-development.versioner.io`)
3. Ensure there's no trailing slash in the URL

### Environment Required for Deployment Events

**Problem:** Validation error about missing `environment_name`

**Solution:** For `event_type: deployment`, you must provide the `environment` input:
```yaml
with:
  event_type: deployment
  environment: production  # Required!
```

For build events (`event_type: build`), environment is optional.

## 🆘 Support

- **Documentation:** [docs.versioner.io](https://docs.versioner.io)
- **Issues:** [GitHub Issues](https://github.com/versioner-io/versioner-github-action/issues)
- **Email:** support@versioner.io

## 🙏 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
