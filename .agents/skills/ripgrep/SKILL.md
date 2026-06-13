---
name: ripgrep
description: Uses `ripgrep (rg)` as the main tool to search for text, symbols, functions, classes, configurations, and patterns within software projects. It is significantly faster than grep in large repositories and automatically respects `.gitignore`.
---

# Skill: Ripgrep (rg) - High-Performance Code Search

## Rules

1. Always try to find information with `rg` before opening complete files.
2. Prefer JSON output (`--json`) when the information will be consumed by an AI agent.
3. Limit the search by file type when possible (`-t`).
4. Use literal search (`-F`) when you don't need regular expressions.
5. Use `-n` to get line numbers.
6. Use `-C`, `-A` or `-B` to get context.
7. If you find no results and suspect exclusions due to `.gitignore`, use `-uu`.
8. Never scan the entire project unnecessarily when you know the target language or directory.
9. Before opening full files, try to get enough context through structured searches.

## Priority for AI Agents

When possible use:

rg --json "<pattern>"

JSON output contains structured metadata such as:

* Full file path.
* Line number.
* Match position.
* Matched text.
* File start and end events.
* Search statistics.

This enables an agent to:

* Identify exactly where to look.
* Reduce unnecessary reads.
* Build dependency maps.
* Correlate multiple results automatically.
* Make decisions based on structure rather than plain text.

## Recommended Commands for AI

Search in JSON:
rg --json "pattern"

Search with context in JSON:
rg --json -C 3 "pattern"

Search by language:
rg --json -t go "CreateUser"

Search specific symbols:
rg --json -w "UserService"

Search literal text:
rg --json -F "user.name"

Search multiple patterns:
rg --json -e "TODO" -e "FIXME"

Search ignoring filters:
rg --json -uu "pattern"

## Recommended Strategy

To locate implementation:

1. rg --json -t <language> "<name>"
2. Analyze most relevant files.
3. Open only the necessary snippets.

To understand architecture:

1. rg --json "<concept>"
2. Group results by file.
3. Identify entry points.
4. Open only files with the highest density of matches.

## Objective

Minimize unnecessary file reading and maximize code discovery speed. Use `ripgrep` as the primary exploration mechanism and always prefer structured output when an automated agent is the consumer of the results.
