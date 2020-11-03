#!/bin/bash

set -eo pipefail

echo "Github workflow: $GITHUB_WORKFLOW"



yarn docgen

git diff

git config user.name "Auto-docs"
git config user.email "github-actions@github.com"

git add docs
git commit -m 'chore: regenerate docs'

echo git push --follow-tags origin $GITHUB_REF
