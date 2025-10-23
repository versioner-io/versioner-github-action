# Contributing to Versioner GitHub Action

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Setup

### Prerequisites

- **Node.js 20.x** or later (use `nvm` to manage versions)
- **npm 9.x** or later
- **Git**
- A **Versioner account** with API access (for integration testing)

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/versioner-github-action.git
   cd versioner-github-action
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs:
   - `@actions/core` and `@actions/github` - GitHub Actions toolkit
   - `axios` - HTTP client
   - TypeScript and build tools
   - Testing framework (Jest)
   - Linting and formatting tools

3. **Build the action:**
   ```bash
   npm run build
   ```

   This compiles TypeScript to JavaScript and bundles everything into `dist/index.js` using `@vercel/ncc`.

   **Important:** The `dist/` directory must be committed because GitHub Actions runs the compiled code, not the TypeScript source.

## Development Workflow

### Project Structure

```
versioner-github-action/
├── src/
│   ├── index.ts           # Main action entrypoint
│   ├── inputs.ts          # Input validation
│   ├── github-context.ts  # GitHub metadata extraction
│   ├── api-client.ts      # Versioner API client
│   └── types.ts           # TypeScript type definitions
├── dist/                  # Compiled output (committed to repo)
├── action.yml             # Action metadata
├── package.json
└── tsconfig.json
```

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Format your code:**
   ```bash
   npm run format
   ```

4. **Lint your code:**
   ```bash
   npm run lint
   ```

5. **Build the action:**
   ```bash
   npm run build
   ```

6. **Run tests:**
   ```bash
   npm test
   ```

7. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for custom metadata
fix: handle API timeout errors gracefully
docs: update README with new examples
```

### Testing

#### Unit Tests

Add tests for new functionality in `src/__tests__/`:

```typescript
// src/__tests__/inputs.test.ts
import { getInputs } from '../inputs'

describe('getInputs', () => {
  it('should validate required inputs', () => {
    // Test implementation
  })
})
```

Run tests:
```bash
npm test
```

#### Integration Testing

Test your changes in a real GitHub workflow:

1. Push your branch to your fork
2. Add repository secret `VERSIONER_API_KEY` and optionally variable `VERSIONER_API_URL` (defaults to production)
3. Create a test workflow in `.github/workflows/test-action.yml`:
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
             api_key: ${{ secrets.VERSIONER_API_KEY }}
             # api_url is optional - defaults to https://api.versioner.io
             # Override with: api_url: ${{ vars.VERSIONER_API_URL }}
             product_name: test-product
             version: ${{ github.sha }}
             environment: test
   ```

### Building for Distribution

The `dist/` directory contains the compiled action code and **must be committed**:

```bash
npm run build
git add dist/
git commit -m "build: update dist"
```

**Important:** Always rebuild and commit `dist/` before creating a pull request.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript and bundle with ncc |
| `npm test` | Run Jest tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run all` | Run format, lint, build, and test |

### Local Testing (Without GitHub Actions)

You can test the TypeScript code locally by setting environment variables:

```bash
# Set environment variables to simulate GitHub Actions inputs
# api_url is optional - defaults to https://api.versioner.io
export INPUT_API_URL="https://api-development.versioner.io"  # Optional: for testing
export INPUT_API_KEY="sk_test_xxx"
export INPUT_PRODUCT_NAME="test-product"
export INPUT_VERSION="1.0.0"
export INPUT_ENVIRONMENT="test"
export INPUT_STATUS="success"
export INPUT_METADATA="{}"

# Run the compiled action
node dist/index.js
```

### Common Issues

#### `dist/` is out of date

**Error:** CI fails with "dist/ directory is out of date"

**Solution:** Rebuild and commit:
```bash
npm run build
git add dist/
git commit -m "build: update dist"
```

#### Tests failing

**Error:** Tests fail locally

**Solution:** Clear Jest cache and reinstall:
```bash
npm run test -- --clearCache
rm -rf node_modules
npm install
npm test
```

#### TypeScript errors

**Error:** TypeScript compilation errors

**Solution:** Check your `tsconfig.json` and ensure all types are correct:
```bash
npx tsc --noEmit
```

## Pull Request Process

1. **Update documentation** if you've added or changed functionality
2. **Add tests** for new features
3. **Ensure all tests pass:** `npm test`
4. **Build the action:** `npm run build`
5. **Commit the `dist/` directory**
6. **Push to your fork** and create a pull request
7. **Describe your changes** in the PR description

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] `dist/` directory rebuilt and committed
- [ ] Commit messages follow conventional commits
- [ ] PR description clearly explains the changes

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules (run `npm run lint`)
- Use Prettier for formatting (run `npm run format`)
- Add JSDoc comments for public functions
- Use meaningful variable and function names

## Reporting Bugs

Create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs or error messages
- Environment details (OS, Node version, etc.)

## Feature Requests

Create an issue with:
- Clear description of the feature
- Use case and motivation
- Example usage (if applicable)

## Questions?

- Open a GitHub issue for questions
- Check existing issues and PRs first
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
