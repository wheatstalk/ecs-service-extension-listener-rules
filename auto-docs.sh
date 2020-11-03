#!/bin/bash

set -eo pipefail

yarn docgen
git diff

git config user.name "Auto-docs"
git config user.email "github-actions@github.com"

git add docs
git commit -m 'chore: regenerate docs'
