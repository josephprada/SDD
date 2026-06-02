# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | C:\Users\j.prada\.config\opencode\skills\branch-pr\SKILL.md |
| When writing Go tests, using teatest, or adding test coverage | go-testing | C:\Users\j.prada\.config\opencode\skills\go-testing\SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | C:\Users\j.prada\.config\opencode\skills\issue-creation\SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | C:\Users\j.prada\.config\opencode\skills\judgment-day\SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | C:\Users\j.prada\.config\opencode\skills\skill-creator\SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue — no exceptions
- Every PR MUST have exactly one `type:*` label
- Automated checks must pass before merge is possible
- Blank PRs without issue linkage will be blocked by GitHub Actions
- Branch naming: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- Conventional commits: `^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9\._-]+\))?!?: .+`

### go-testing
- Use table-driven tests for multiple test cases
- Test Model.Update() directly for Bubbletea TUI state changes
- Use teatest.NewTestModel() for full TUI integration flows
- Use golden file testing for view/rendering verification
- Run: `go test ./...`, `go test -v ./...`, `go test -cover ./...`, `go test -update ./...`

### issue-creation
- Blank issues are disabled — MUST use a template (bug report or feature request)
- Every issue gets `status:needs-review` automatically on creation
- A maintainer MUST add `status:approved` before any PR can be opened
- Questions go to Discussions, not issues

### judgment-day
- Launch TWO judges in parallel via delegate (async) — never sequential
- Both judges work independently — no cross-contamination
- Classify warnings: Can a normal user trigger this? YES → real, NO → theoretical
- After fixes: re-launch both judges in parallel for re-judgment
- APPROVED criteria: 0 confirmed CRITICALs + 0 confirmed real WARNINGs

### skill-creator
- Skill structure: `skills/{skill-name}/SKILL.md` with optional assets/ and references/
- Frontmatter required: name, description (with Trigger), license, metadata
- Keep content focused — documentation links to local files, not web URLs
- Name pattern: `{technology}` for generic, `{project-component}` for project-specific

## Project Conventions

No project conventions found. The project directory is empty.

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.