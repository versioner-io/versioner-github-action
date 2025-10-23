# Project Structure

Complete structure of the Versioner GitHub Action repository.

```
versioner-github-action/
│
├── README.md                          # Main user-facing documentation
├── QUICKSTART.md                      # 5-minute getting started guide
├── SETUP.md                           # Development setup guide
├── EXAMPLES.md                        # Comprehensive usage examples
├── CONTRIBUTING.md                    # Contribution guidelines
├── LICENSE                            # MIT License
├── PROJECT_STRUCTURE.md               # This file
│
├── action.yml                         # GitHub Action metadata (inputs/outputs)
├── package.json                       # Node.js dependencies and scripts
├── tsconfig.json                      # TypeScript compiler configuration
├── jest.config.js                     # Jest testing configuration
├── .eslintrc.json                     # ESLint linting rules
├── .prettierrc.json                   # Prettier formatting rules
├── .nvmrc                             # Node version specification
├── .gitignore                         # Git ignore patterns
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                     # CI pipeline (test, lint, build)
│   │   └── test-action.yml            # Manual action testing workflow
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # Bug report template
│   │   └── feature_request.md         # Feature request template
│   └── pull_request_template.md       # PR template
│
├── src/                               # TypeScript source code
│   ├── index.ts                       # Main action entrypoint
│   ├── types.ts                       # TypeScript type definitions
│   ├── inputs.ts                      # Input validation and parsing
│   ├── github-context.ts              # GitHub metadata extraction
│   ├── api-client.ts                  # Versioner API HTTP client
│   └── __tests__/                     # Unit tests
│       ├── inputs.test.ts             # Tests for input validation
│       └── github-context.test.ts     # Tests for GitHub context
│
└── dist/                              # Compiled JavaScript (committed!)
    └── index.js                       # Bundled action code (generated)
```

## Key Files Explained

### User Documentation

- **README.md** - Primary documentation with usage examples, inputs/outputs, and integration guide
- **QUICKSTART.md** - Fast 5-minute setup guide for new users
- **EXAMPLES.md** - Comprehensive examples covering common scenarios
- **SETUP.md** - Development environment setup for contributors

### Action Configuration

- **action.yml** - Defines the action metadata, inputs, outputs, and runtime
- **package.json** - Node.js dependencies and npm scripts
- **tsconfig.json** - TypeScript compilation settings (strict mode enabled)

### Code Quality

- **.eslintrc.json** - ESLint rules for code quality and consistency
- **.prettierrc.json** - Code formatting rules
- **jest.config.js** - Test configuration with coverage thresholds

### Source Code

- **src/index.ts** - Main entrypoint that orchestrates the action
- **src/types.ts** - TypeScript interfaces for type safety
- **src/inputs.ts** - Validates and parses GitHub Action inputs
- **src/github-context.ts** - Extracts metadata from GitHub context
- **src/api-client.ts** - HTTP client for Versioner API with error handling

### Testing

- **src/__tests__/** - Unit tests using Jest
- **.github/workflows/ci.yml** - Automated testing on every PR
- **.github/workflows/test-action.yml** - Manual integration testing

### Distribution

- **dist/index.js** - Compiled and bundled JavaScript (must be committed)
- This is what GitHub Actions actually runs (not the TypeScript source)

## Development Workflow

1. **Edit TypeScript** in `src/`
2. **Run tests** with `npm test`
3. **Build** with `npm run build` (creates `dist/index.js`)
4. **Commit both** `src/` and `dist/`

## File Sizes

- **Total TypeScript source:** ~800 lines
- **Total documentation:** ~1,500 lines
- **Total tests:** ~150 lines
- **Compiled bundle:** ~1MB (includes all dependencies)

## Dependencies

### Runtime Dependencies
- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub context and API
- `axios` - HTTP client for API calls

### Development Dependencies
- `typescript` - TypeScript compiler
- `@vercel/ncc` - Bundler for GitHub Actions
- `jest` - Testing framework
- `eslint` - Linting
- `prettier` - Code formatting

## Next Steps

- **For users:** Start with [QUICKSTART.md](./QUICKSTART.md)
- **For contributors:** Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [SETUP.md](./SETUP.md)
- **For examples:** See [EXAMPLES.md](./EXAMPLES.md)
