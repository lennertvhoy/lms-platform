#!/usr/bin/env bash
set -euo pipefail

# Script to scaffold a GitHub contribution workflow using GitHub CLI

if ! command -v gh > /dev/null; then
  echo "GitHub CLI (gh) not found. Please install from https://cli.github.com/" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "This script must be run from the repository root." >&2
  exit 1
fi

# Ensure main is up to date
git fetch origin

# Prompt for branch name
read -p "Enter your feature branch name (e.g. feature/my-change): " BRANCH

# Stash local changes to avoid overwrite
if [ -n "$(git status --porcelain)" ]; then
  echo "Stashing local changes..."
  git stash push -u -m "pre-$BRANCH-stash" || true
  STASHED=1
else
  STASHED=0
fi

# Create and check out branch off main
git checkout origin/main -b "$BRANCH"

# Apply stashed changes, if any
if [ "${STASHED:-0}" -eq 1 ]; then
  echo "Applying stashed changes to branch $BRANCH..."
  git stash pop || true
fi

echo "Branch '$BRANCH' created and checked out."
echo "Make your changes, then commit and push:"
echo "  git add ."
echo "  git commit -m 'Describe your changes'"
echo "  git push --set-upstream origin $BRANCH"

echo
 echo "When ready, open a PR with:"
 echo "  gh pr create --fill --base main --head $BRANCH"

echo "Thank you for contributing!" 