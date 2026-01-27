# Publish Subroutine

## Description
A comprehensive routine to prepare, commit, squash, push, update PR, and deploy changes. Ensures no build errors before committing.

## Steps
1. **Check for Build Errors**: Run `npm run build` to ensure there are no compiling or building errors. If errors occur, stop and report them.
2. **Commit All Unsaved Changes**: Run `git add .` and `git commit -m "<high-level summary>"` to commit all changes.
3. **Squash Commits**: Squash all commits since the last merge into a single commit. Use `git rebase -i HEAD~<n>` where <n> is the number of commits since the last merge.
4. **Push Changes**: Push the squashed commit to the remote branch (e.g., `git push origin <branch> --force-with-lease`).
5. **Update PR**: Ensure the PR description includes a high-level list of all changes from the squashed commit.
6. **Deploy**: Run `npm run deploy` to deploy to production.

## Usage
Invoke by saying: "Run the Publish subroutine" or "Execute Publish routine".

## Notes
- Assumes the project uses npm for building and deploying.
- The commit message should summarize high-level changes.
- If squashing fails or there are conflicts, handle interactively.