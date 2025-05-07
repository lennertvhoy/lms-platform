#!/usr/bin/env bash
# Git helper to stage, commit, and push changes following standard workflow.

set -euo pipefail

# Ensure we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: not a Git repository."
  exit 1
fi

# Check for uncommitted changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit."
  exit 0
fi

# Stage all changes
echo "Staging changes..."
git add -A

# Get commit message
if [ "$#" -ge 1 ]; then
  COMMIT_MSG="$*"
else
  echo -n "Enter commit message: "
  read -r COMMIT_MSG
fi

if [ -z "$COMMIT_MSG" ]; then
  echo "Abort: commit message cannot be empty."
  exit 1
fi

echo "Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Determine current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Pushing branch '$BRANCH' to origin..."
# Push and set upstream if not already set
if ! git push -u origin "$BRANCH"; then
  echo "Error: Git push failed. Password authentication is no longer supported." >&2
  echo "Please authenticate using SSH or GitHub CLI:" >&2
  echo "  gh auth login" >&2
  echo "Or switch remote to SSH: git remote set-url origin git@github.com:<USER>/<REPO>.git" >&2
  exit 1
fi

echo "Done!" 