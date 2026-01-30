# Publish Subroutine

## Description

A comprehensive routine to prepare, commit, squash, push, update PR, and deploy changes. Ensures no build errors or test failures before committing. Optimized for speed with parallel operations and conditional testing.

## Steps

1. **Check and Commit Unsaved Changes**:
   - Check for any uncommitted changes with `git status`.
   - If there are changes, run `git add .` and `git commit -m "<high-level summary>"` to commit all changes.
   - If no changes, proceed to next step.

2. **Update Documentation (As Required)**:
   - **SPEC.md**: Update the specification document if any design decisions, responsive behaviors, component structures, or UI patterns have changed.
   - **CHANGELOG.md**: Add entries for new features, changes, and fixes under the appropriate version header.
   - **Tests**: Update or add tests in respective `*.test.js` files when:
     - New features or components are added.
     - Existing behavior changes.
     - Bug fixes require regression coverage.
   - **instructions.md**: Update developer instructions if specification values or behaviors have changed.

3. **Build and Test (Optimized)**:
   - **Parallel Execution**: Run `bun run build` and `bun run test --watchAll=false --maxWorkers=50%` concurrently where possible.
   - **Layout & Logic Checks**: Ensure tests cover critical UI behavior (e.g., Dashboard vs. Toolbar mutual exclusivity).
     - If deploying to production: Always run full test suite.
     - If on dev branch with only non-code changes (docs, config): Skip tests, run build only.
     - If code changes detected: Run full test suite.
   - Stop and fix any build errors or test failures before proceeding.

4. **Squash Commits**: Squash all commits since the last merge into a single commit. Use `git rebase -i HEAD~<n>` where <n> is the number of commits since the last merge. If conflicts arise, handle interactively.

5. **Push Changes**: Push the squashed commit to the remote branch (e.g., `git push origin <branch> --force-with-lease`).

6. **Update PR**: Ensure the PR description includes a high-level list of all changes from the squashed commit.

7. **Deploy**: Run `bun run deploy` to deploy to production.

## Usage

Invoke by saying: "Run the Publish subroutine" or "Execute Publish routine".

## Notes

- Assumes the project uses bun for building, testing, and deploying.
- The commit message should summarize high-level changes.
- **Optimization**: Parallel build/test execution and conditional testing reduce CI time while maintaining quality.
- **Branch Merging Checks**: Always perform thorough checks before merging, even with optimizations.
- **Behavioral Clashes**: If new changes cause unexpected interactions or breaking changes elsewhere, pause and consult for expected behavior to avoid circular fixes or unintended side effects.
