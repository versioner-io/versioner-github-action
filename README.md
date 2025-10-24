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
| `api_url` | ❌ | `https://api.versioner.io` | Versioner API endpoint (override for testing or self-hosted) |
| `api_key` | ✅ | - | Versioner API key (store in GitHub Secrets) |
| `product_name` | ❌ | repo name | Name of the product/service (defaults to repository name) |
| `version` | ✅ | - | Version identifier (e.g., git SHA, semantic version, build number) |
| `environment` | ❌ | - | Target environment (required for deployment events, optional for build events) |
| `event_type` | ❌ | `deployment` | Event type: `build` or `deployment` |
| `status` | ❌ | `success` | Event status (`success`, `failure`, `in_progress`) |
| `metadata` | ❌ | `{}` | Additional JSON metadata to attach to the event |
| `fail_on_rejection` | ❌ | `false` | Fail the workflow if Versioner rejects the deployment (e.g., conflicts, no-deploy windows) |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `deployment_id` | UUID of the created deployment record (deployment events only) |
| `event_id` | UUID of the deployment event (deployment events only) |
| `version_id` | UUID of the created version record (build events only) |
| `product_id` | UUID of the product (all events) |

## 🔧 Usage Examples

### Track a Build (No Deployment)

```yaml
- name: Track build
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    version: ${{ github.sha }}
    event_type: build
    # No environment needed - just tracking the build!
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

### Enforce Deployment Policies

Fail the workflow if Versioner rejects the deployment (e.g., no-deploy windows, concurrent deployments):

```yaml
- name: Deploy to production
  uses: versioner-io/versioner-github-action@v1
  with:
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    version: ${{ github.sha }}
    environment: production
    fail_on_rejection: true  # Fail if Versioner blocks deployment
```

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

- `scm_repository` - Repository name (e.g., `owner/repo`)
- `scm_sha` - Git commit SHA
- `scm_branch` - Branch name (e.g., `main`)
- `source_system` - Always set to `"github"`
- `build_number` - GitHub Actions run number
- `invoke_id` - GitHub Actions run ID
- `build_url` - Link to the GitHub Actions run
- `deployed_by` / `built_by` - GitHub username who triggered the workflow
- `deployed_by_email` / `built_by_email` - Email from commit author (when available)
- `deployed_by_name` / `built_by_name` - Full name from commit author (when available)
- `completed_at` / `built_at` - Timestamp when the action runs

**Note:** Email and name fields are extracted from commit metadata and are only available for `push` events. For `workflow_dispatch` (manual triggers) or other event types, these fields will be `null`.

## 🏗️ How It Works

1. **Validates inputs** - Ensures all required fields are provided
2. **Enriches metadata** - Adds GitHub context automatically
3. **Calls Versioner API** - POSTs to `/deployment-events/` endpoint
4. **Handles errors** - Provides clear error messages and GitHub annotations
5. **Outputs IDs** - Returns deployment and event IDs for downstream steps

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
