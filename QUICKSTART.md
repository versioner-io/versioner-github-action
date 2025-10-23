# Quick Start Guide

Get started with the Versioner GitHub Action in 5 minutes.

## Step 1: Get Your API Credentials

1. Sign up at [versioner.io](https://versioner.io)
2. Create an API key in your account settings
3. Note your API endpoint (e.g., `https://api.versioner.io`)

## Step 2: Add Secrets to GitHub

You can add secrets to your GitHub repository or organization.

For repository level: Go to your repository → **Settings** → **Secrets and variables** → **Actions**

For organization level: Go to your organization → **Settings** → **Secrets and variables** → **Actions**

Add two secrets:
- `VERSIONER_API_URL` - Your API endpoint (e.g., `https://api.versioner.io`)
- `VERSIONER_API_KEY` - Your API key (e.g., `sk_1234567890`)

## Step 3: Add to Your Workflow

Create or update `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Your deployment steps here
      - name: Deploy to production
        run: ./deploy.sh production

      # Track the deployment
      - name: Track deployment in Versioner
        uses: versioner-io/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
```

## Step 4: Push and Deploy

```bash
git add .github/workflows/deploy.yml
git commit -m "Add Versioner tracking"
git push origin main
```

## Step 5: View Your Deployment

Check the Actions tab in your GitHub repository to see the deployment tracked!

## What Gets Tracked?

The action automatically captures:
- ✅ Product name and version
- ✅ Environment (production, staging, etc.)
- ✅ Git repository and commit SHA
- ✅ Who deployed it
- ✅ When it was deployed
- ✅ Build number and workflow run URL
- ✅ Deployment status (success/failure)

## Next Steps

- **Add multiple environments:** Track dev, staging, and production
- **Include custom metadata:** Add deployment duration, region, etc.
- **Handle failures:** Track failed deployments for visibility
- **Explore examples:** See [EXAMPLES.md](./EXAMPLES.md) for advanced usage

## Need Help?

- 📖 [Full Documentation](./README.md)
- 💡 [Usage Examples](./EXAMPLES.md)
- 🐛 [Report Issues](https://github.com/versioner-io/versioner-github-action/issues)
- 📧 [Email Support](mailto:support@versioner.io)
