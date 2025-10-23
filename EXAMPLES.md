# Usage Examples

This document provides comprehensive examples of using the Versioner GitHub Action in various scenarios.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Multi-Environment Deployments](#multi-environment-deployments)
- [Semantic Versioning](#semantic-versioning)
- [Custom Metadata](#custom-metadata)
- [Error Handling](#error-handling)
- [Conditional Deployment](#conditional-deployment)
- [Matrix Deployments](#matrix-deployments)
- [Using Outputs](#using-outputs)

## Basic Usage

### Simple Deployment Tracking

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

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-api-service
          version: ${{ github.sha }}
          environment: production
```

## Multi-Environment Deployments

### Sequential Environments

```yaml
name: Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  deploy-dev:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh dev
      - uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: dev

  deploy-staging:
    needs: deploy-dev
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh staging
      - uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production  # Requires manual approval
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh production
      - uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
```

## Semantic Versioning

### Using Git Tags

```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Build and deploy
        run: |
          ./build.sh
          ./deploy.sh production

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ steps.version.outputs.VERSION }}
          environment: production
          metadata: |
            {
              "release_type": "production",
              "git_tag": "${{ github.ref_name }}"
            }
```

### Using Package Version

```yaml
name: Deploy NPM Package

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get package version
        id: package
        run: echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_OUTPUT

      - name: Publish to NPM
        run: npm publish

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-npm-package
          version: ${{ steps.package.outputs.VERSION }}
          environment: npm-registry
```

## Custom Metadata

### Deployment Duration and Details

```yaml
name: Deploy with Metrics

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Record start time
        id: start
        run: echo "TIME=$(date +%s)" >> $GITHUB_OUTPUT

      - name: Deploy application
        id: deploy
        run: |
          ./deploy.sh production
          echo "REGION=us-east-1" >> $GITHUB_OUTPUT
          echo "STRATEGY=blue-green" >> $GITHUB_OUTPUT

      - name: Calculate duration
        id: duration
        run: |
          END_TIME=$(date +%s)
          DURATION=$((END_TIME - ${{ steps.start.outputs.TIME }}))
          echo "SECONDS=$DURATION" >> $GITHUB_OUTPUT

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
          metadata: |
            {
              "duration_seconds": ${{ steps.duration.outputs.SECONDS }},
              "deployment_strategy": "${{ steps.deploy.outputs.STRATEGY }}",
              "region": "${{ steps.deploy.outputs.REGION }}",
              "runner_os": "${{ runner.os }}",
              "triggered_by_event": "${{ github.event_name }}"
            }
```

### Infrastructure Details

```yaml
- name: Track deployment with infrastructure metadata
  uses: versioner-app/versioner-github-action@v1
  with:
    api_url: ${{ secrets.VERSIONER_API_URL }}
    api_key: ${{ secrets.VERSIONER_API_KEY }}
    product_name: my-service
    version: ${{ github.sha }}
    environment: production
    metadata: |
      {
        "kubernetes_cluster": "prod-us-east-1",
        "namespace": "production",
        "replicas": 3,
        "image_tag": "${{ github.sha }}",
        "helm_chart_version": "2.1.0",
        "rollout_strategy": "rolling-update"
      }
```

## Error Handling

### Report Deployment Failures

```yaml
name: Deploy with Error Handling

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy application
        id: deploy
        run: ./deploy.sh production
        continue-on-error: true

      - name: Track deployment status
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
          status: ${{ steps.deploy.outcome }}
          metadata: |
            {
              "exit_code": "${{ steps.deploy.outputs.exit_code }}",
              "deployment_attempted": true
            }

      - name: Fail workflow if deployment failed
        if: steps.deploy.outcome == 'failure'
        run: exit 1
```

### Track In-Progress Deployments

```yaml
name: Long-Running Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start deployment tracking
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
          status: in_progress

      - name: Run deployment
        run: ./long-deploy.sh production

      - name: Update deployment status
        if: always()
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production
          status: ${{ job.status }}
```

## Conditional Deployment

### Deploy Only on Main Branch

```yaml
name: Conditional Deploy

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to appropriate environment
        id: deploy
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            ./deploy.sh production
            echo "ENV=production" >> $GITHUB_OUTPUT
          else
            ./deploy.sh staging
            echo "ENV=staging" >> $GITHUB_OUTPUT
          fi

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: ${{ steps.deploy.outputs.ENV }}
```

### Deploy Only on Tag

```yaml
name: Deploy on Tag

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh production

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.ref_name }}
          environment: production
```

## Matrix Deployments

### Deploy to Multiple Regions

```yaml
name: Multi-Region Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        region: [us-east-1, us-west-2, eu-west-1]
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to ${{ matrix.region }}
        run: ./deploy.sh production ${{ matrix.region }}

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production-${{ matrix.region }}
          metadata: |
            {
              "region": "${{ matrix.region }}",
              "multi_region": true
            }
```

### Deploy Multiple Services

```yaml
name: Microservices Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api, worker, scheduler]
    steps:
      - uses: actions/checkout@v4

      - name: Deploy ${{ matrix.service }}
        run: ./deploy-${{ matrix.service }}.sh production

      - name: Track deployment
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: ${{ matrix.service }}
          version: ${{ github.sha }}
          environment: production
```

## Using Outputs

### Use Deployment ID in Downstream Steps

```yaml
name: Deploy with Notifications

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh production

      - name: Track deployment
        id: versioner
        uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-service
          version: ${{ github.sha }}
          environment: production

      - name: Send Slack notification
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "Deployment tracked!",
              "blocks": [{
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "Deployment ID: `${{ steps.versioner.outputs.deployment_id }}`\nEvent ID: `${{ steps.versioner.outputs.event_id }}`"
                }
              }]
            }'
```

## Advanced Examples

### Monorepo with Multiple Products

```yaml
name: Monorepo Deploy

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.changes.outputs.api }}
      web: ${{ steps.changes.outputs.web }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            api:
              - 'packages/api/**'
            web:
              - 'packages/web/**'

  deploy-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy-api.sh production
      - uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-api
          version: ${{ github.sha }}
          environment: production

  deploy-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy-web.sh production
      - uses: versioner-app/versioner-github-action@v1
        with:
          api_url: ${{ secrets.VERSIONER_API_URL }}
          api_key: ${{ secrets.VERSIONER_API_KEY }}
          product_name: my-web-app
          version: ${{ github.sha }}
          environment: production
```

## Best Practices

1. **Always use GitHub Secrets** for `api_key` - never hardcode credentials
2. **Use descriptive product names** that match your service naming conventions
3. **Include relevant metadata** to make deployments searchable and auditable
4. **Track both successes and failures** for complete visibility
5. **Use consistent environment names** across your organization
6. **Leverage outputs** for integration with other tools (Slack, PagerDuty, etc.)
