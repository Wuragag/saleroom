#!/bin/bash
# Boots a Claude Code on the web session so tests, typecheck, and linters work
# immediately: installs deps and generates the Prisma client (which lives at
# src/generated/prisma — without it, tsc/tests report spurious "cannot find
# module '@/generated/prisma'" errors; see CLAUDE.md).
#
# Idempotent and non-interactive. Runs only in the remote (web) environment so
# local sessions aren't slowed down.
set -euo pipefail

# Only run in Claude Code on the web; local machines manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# npm install (not ci) so the cached container layer is reused across sessions.
npm install

# Generate the Prisma client into src/generated/prisma.
npx prisma generate

echo "session-start: dependencies installed and Prisma client generated."
