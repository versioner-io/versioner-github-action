# Setup Guide

This guide walks you through setting up the Versioner GitHub Action for development and testing.

## Prerequisites

- **Node.js 20.x** or later (use `nvm` to manage versions)
- **npm 9.x** or later
- **Git**
- A **Versioner account** with API access

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This installs all required dependencies including:
- `@actions/core` and `@actions/github` - GitHub Actions toolkit
- `axios` - HTTP client
- TypeScript and build tools
- Testing framework (Jest)
- Linting and formatting tools

### 2. Build the Action

```bash
npm run build
```

This compiles TypeScript to JavaScript and bundles everything into `dist/index.js` using `@vercel/ncc`.

**Important:** The `dist/` directory must be committed to the repository because GitHub Actions runs the compiled code, not the TypeScript source.

## Development Workflow

### Making Changes

1. **Edit TypeScript files** in `src/`
2. **Format code:** `npm run format`
3. **Lint code:** `npm run lint`
4. **Build:** `npm run build`
5. **Test:** `npm test`
6. **Commit both `src/` and `dist/`:**
   ```bash
   git add src/ dist/
   git commit -m "feat: your change description"
   ```

### Running All Checks

```bash
npm run all
```

This runs format, lint, build, and test in sequence.

## Testing the Action

### Unit Tests

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Integration Testing

Test the action in a real GitHub workflow:

1. **Set up secrets** in your repository:
   - `VERSIONER_API_URL` - Your Versioner API endpoint
   - `VERSIONER_API_KEY` - Your Versioner API key

2. **Create a test workflow** (`.github/workflows/test.yml`):
   ```yaml
   name: Test Action
   on: [push]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: ./
           with:
             api_url: ${{ secrets.VERSIONER_API_URL }}
             api_key: ${{ secrets.VERSIONER_API_KEY }}
             product_name: test-product
             version: ${{ github.sha }}
             environment: test
   ```

3. **Push to GitHub** and check the Actions tab

### Local Testing (Without GitHub Actions)

You can test the TypeScript code locally:

```bash
# Set environment variables to simulate GitHub Actions inputs
export INPUT_API_URL="https://api.versioner.io"
export INPUT_API_KEY="sk_test_xxx"
export INPUT_PRODUCT_NAME="test-product"
export INPUT_VERSION="1.0.0"
export INPUT_ENVIRONMENT="test"
export INPUT_STATUS="success"
export INPUT_METADATA="{}"

# Run the compiled action
node dist/index.js
```

## Project Structure

```
versioner-github-action/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline (tests, linting, build)
│       └── test-action.yml     # Manual action testing
├── src/
│   ├── __tests__/              # Unit tests
│   │   ├── inputs.test.ts
│   │   └── github-context.test.ts
│   ├── index.ts                # Main entrypoint
│   ├── inputs.ts               # Input validation
│   ├── github-context.ts       # GitHub metadata extraction
│   ├── api-client.ts           # Versioner API client
│   └── types.ts                # TypeScript types
├── dist/
│   └── index.js                # Compiled bundle (committed!)
├── action.yml                  # Action metadata
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript config
├── jest.config.js              # Jest config
├── .eslintrc.json              # ESLint config
├── .prettierrc.json            # Prettier config
└── README.md                   # User-facing documentation
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript and bundle with ncc |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run all` | Run format, lint, build, and test |

## Common Issues

### `dist/` is out of date

**Error:** CI fails with "dist/ directory is out of date"

**Solution:** Rebuild and commit:
```bash
npm run build
git add dist/
git commit -m "build: update dist"
```

### Tests failing

**Error:** Tests fail locally

**Solution:** Clear Jest cache and reinstall:
```bash
npm run test -- --clearCache
rm -rf node_modules
npm install
npm test
```

### TypeScript errors

**Error:** TypeScript compilation errors

**Solution:** Check your `tsconfig.json` and ensure all types are correct:
```bash
npx tsc --noEmit
```

## Getting Versioner API Credentials

1. Sign up at [versioner.io](https://versioner.io)
2. Navigate to your account settings
3. Create a new API key
4. Note your API endpoint URL (e.g., `https://api.versioner.io`)
5. Store these in GitHub Secrets for testing

## Next Steps

- Read [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines
- Check [README.md](./README.md) for usage examples
- Review the [Versioner API documentation](https://docs.versioner.io)

## Support

- **Issues:** [GitHub Issues](https://github.com/versioner-io/versioner-github-action/issues)
- **Documentation:** [docs.versioner.io](https://docs.versioner.io)
- **Email:** support@versioner.io
