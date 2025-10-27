# Development TODO

This document tracks the remaining tasks to complete the Versioner GitHub Action.

## Recent Updates (Oct 23, 2025)

✅ **Completed:**
- Added support for build-only events (`event_type: build`)
- Implemented `fail_on_rejection` feature for deployment policy enforcement
- Added `scm_branch` extraction from GitHub context
- Consolidated documentation (merged QUICKSTART.md, SETUP.md, PROJECT_STRUCTURE.md)
- Created `.windsurfrules` for AI assistant context
- All tests passing, action built and ready

⏳ **Next Step:** Integration testing with live Versioner API (waiting on API updates)

## Phase 1: Initial Setup ✅

- [x] Create repository structure
- [x] Write comprehensive README
- [x] Set up TypeScript configuration
- [x] Configure ESLint and Prettier
- [x] Create action.yml metadata
- [x] Implement core TypeScript modules
- [x] Add unit tests
- [x] Create documentation (QUICKSTART, EXAMPLES, SETUP, CONTRIBUTING)
- [x] Add GitHub issue/PR templates
- [x] Create CI workflow

## Phase 2: Build and Test ✅

- [x] Install dependencies: `npm install`
- [x] Run linter: `npm run lint`
- [x] Run tests: `npm test`
- [x] Build action: `npm run build`
- [x] Commit dist/: `git add dist/ && git commit -m "build: initial build"`
- [x] Add support for build events (`event_type: build`)
- [x] Add `fail_on_rejection` input for deployment policy enforcement
- [x] Extract `scm_branch` from GitHub context
- [x] Consolidate documentation files

## Phase 3: Integration Testing ✅ (COMPLETED)

**Status:** All integration tests passing! Action successfully communicates with API.

**API Endpoints:**
- Dev: `https://api-development.versioner.io`
- Prod: `https://api.versioner.io`

**Completed:**
- [x] Created comprehensive integration test workflow (`.github/workflows/test-action.yml`)
- [x] Run tests against dev environment - ALL PASSING ✅
- [x] Verify build events in Versioner dashboard
- [x] Verify deployment events in Versioner dashboard
- [x] Verify multi-environment tracking
- [x] Verify all status types (success, failure, in_progress)
- [x] Verify custom metadata
- [x] Updated API schema to match latest endpoints
- [x] Added user tracking fields (deployed_by, deployed_by_email, deployed_by_name)
- [x] Added timestamp fields (built_at, completed_at)

**Notes:**
- Email/name fields populate from commit author (available in push events, not workflow_dispatch)
- API now accepts string usernames for deployed_by/built_by (no UUID required)
- All payloads match current API schema

## Phase 4: Documentation Review ✅ (COMPLETED)

**Goal:** Ensure all documentation is accurate and ready for public release.

**Completed:**
- [x] Review README for accuracy and completeness
- [x] Verify all examples in EXAMPLES.md work with current API
- [x] Review CONTRIBUTING.md for accuracy
- [x] Ensure action.yml descriptions are clear
- [x] Add troubleshooting section to README
- [x] Document email field behavior (only available in push events)
- [x] Update auto-populated metadata section with new fields
- [x] Remove debug logging from code

**Notes:**
- All documentation reflects current API schema
- Troubleshooting section covers common issues
- Examples are clean and use optional api_url correctly

## Phase 5: Publishing 🔲

### GitHub Release

- [ ] Create v1.0.0 tag
- [ ] Create GitHub release with changelog
- [ ] Verify action works with `@v1` tag

### GitHub Marketplace

- [ ] Publish to GitHub Marketplace
- [ ] Add marketplace badges to README
- [ ] Verify marketplace listing looks good

### Documentation Site

- [ ] Link from main Versioner docs
- [ ] Add to Versioner website
- [ ] Create integration guide

## Phase 6: Monitoring and Maintenance 🔲

- [ ] Set up issue tracking
- [ ] Monitor for bug reports
- [ ] Respond to community feedback
- [ ] Plan v1.1.0 features

## Future Enhancements 💡

### Features to Consider

- [ ] Support for deployment rollbacks
- [ ] Batch deployment events (multiple products at once)
- [ ] Deployment approval workflow integration
- [ ] Support for deployment annotations/notes
- [ ] Automatic changelog generation
- [ ] Integration with GitHub Deployments API
- [ ] Support for deployment environments (GitHub Environments)
- [ ] Retry logic with exponential backoff
- [ ] Caching for faster execution
- [ ] Support for custom API endpoints per environment

### Testing Improvements

- [ ] Add integration tests with mock API
- [ ] Add end-to-end tests
- [ ] Increase test coverage to 90%+
- [ ] Add performance benchmarks

### Documentation Improvements

- [ ] Add video tutorial
- [ ] Create interactive demo
- [ ] Add troubleshooting guide
- [ ] Create FAQ section
- [ ] Add comparison with other tools

## Known Issues

None yet - track issues in GitHub Issues.

## Questions to Resolve

- [ ] Should we support deployment approvals?
- [ ] Should we integrate with GitHub Deployments API?
- [ ] Should we add support for deployment comments/notes?
- [ ] What's the best way to handle long-running deployments?

## Release Checklist

When ready to release v1.0.0:

- [ ] All tests passing
- [ ] Documentation complete and reviewed
- [ ] dist/ built and committed
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md created
- [ ] Git tag created: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Tag pushed: `git push origin v1.0.0`
- [ ] GitHub release created
- [ ] Marketplace listing published
- [ ] Announcement posted (Twitter, blog, etc.)

## Notes

- Remember to rebuild dist/ after every change to src/
- Test in a real workflow before releasing
- Keep documentation in sync with code changes
- Follow semantic versioning for releases

### API Integration Notes

**Breaking Changes Implemented (Oct 27, 2025):**
- ✅ Migrated from `/version-events/` to `/build-events/` endpoint
- ✅ Updated request schema with `build_number`, `error_message`, `error_code`
- ✅ Updated response schema to include `build_id`, `started_at`, `completed_at`
- ✅ Added `build_id` output to action
- ✅ All tests passing with new schema

**For Backend Team:**
- API spec for rejection feature: `.notes/DEPLOYMENT_REJECTION_SPEC.md`
- Breaking changes spec: `.notes/build-events-breaking-changes.md`
- Rejection status codes: 409, 423, 428 (already implemented)
- Response format must include `error` and `message` fields

**Action is ready** - all code updated for new API schema.
