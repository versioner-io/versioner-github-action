---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Configure action with inputs: '...'
2. Run workflow '...'
3. See error

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened.

## Workflow Configuration

```yaml
# Paste your workflow YAML here (remove sensitive data like API keys)
- uses: versioner-io/versioner-github-action@v1
  with:
    api_url: https://api.versioner.io
    # ... other inputs
```

## Error Logs

```
Paste relevant error logs here
```

## Environment

- **GitHub Actions runner:** (e.g., ubuntu-latest, macos-latest)
- **Action version:** (e.g., v1.0.0, commit SHA)
- **Versioner API version:** (if known)

## Additional Context

Add any other context about the problem here.

## Screenshots

If applicable, add screenshots to help explain your problem.
