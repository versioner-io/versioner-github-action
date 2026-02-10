# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Versioner GitHub Action - a TypeScript GitHub Action that sends build and deployment events to the Versioner API. Node.js 20, @actions/core, Axios.

## Cross-Repo Context

This repo is part of the Versioner ecosystem. Before starting work:
- Read `/Users/phil.austin/projects/versioner-repos/versioner-dev-docs/status.md` for current status
- Read relevant feature docs from `/Users/phil.austin/projects/versioner-repos/versioner-dev-docs/features/`
- Update `status.md` as you complete tasks

## Build & Test Commands

All commands use `just` (run `just` to list all):

```bash
just setup_local_dev    # npm install
just build              # ncc build to dist/index.js (self-contained bundle)
just run_tests          # Jest (80% coverage threshold)
just test_coverage      # Jest with coverage report
just lint               # ESLint (strict: explicit return types, no any)
just format             # Prettier
just ci                 # format -> lint -> build -> test
```

The `dist/` directory is committed (GitHub Actions requires it).

## Architecture

- `src/index.ts` - Entry point; routes to build or deployment event handling based on `event_type` input
- `src/inputs.ts` - Input validation and parsing (from GitHub Actions inputs or env vars)
- `src/api-client.ts` - HTTP client for Versioner API with error handling for preflight rejections (409, 423, 428)
- `src/github-context.ts` - Extracts GitHub metadata (repo, SHA, branch, actor, workflow URL) and auto-captures env vars with `vi_gh_` prefix
- `src/types.ts` - TypeScript interfaces for payloads and responses
- `action.yml` - Action definition with inputs/outputs

## Conventions

- Follow existing code patterns and style
- Blank lines must be completely empty (no whitespace-only lines)
- Add tests for new features; ensure tests pass before committing
- Prefer editing existing files over creating new ones
