#!/usr/bin/env bash
#
# Deploy i-Tamil Recruit to the EC2 host.
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# The t4g.small EC2 has only 2 GB RAM. `vite build` peaks around
# 1.5 GB, and when it runs alongside Postgres + Node + Nginx it
# routinely triggers the Linux OOM killer — which leaves node_modules
# half-installed and every subsequent `tsc` failing on missing
# lib.dom.d.ts / lib.es2023.d.ts files. Rescue was always "nuke
# node_modules and start over", which is slow and human-attention-
# hungry.
#
# Fix: build the frontend LOCALLY on the Mac (where RAM is plentiful),
# then rsync only the tiny `dist/` folder to the server. `vite build`
# never runs on the EC2 again. The backend rebuild — `tsc` only, no
# bundler — still runs on the server because it's cheap and lets
# Prisma migrations run in-place against the local Postgres.
#
# USAGE
# -----
#   scripts/deploy.sh              # both frontend + backend
#   scripts/deploy.sh --frontend   # frontend only (skip SSH + pm2)
#   scripts/deploy.sh --backend    # backend only (skip local build)
#   scripts/deploy.sh --dry-run    # print steps without executing
#
# The script is idempotent — safe to re-run. All destructive steps
# are on the server side (git pull, pm2 restart) and are handled by
# the server's git working tree, not this script.
#
# REQUIREMENTS
# ------------
# - SSH key at pemkey/imerit-key.pem (gitignored)
# - EC2 security group inbound rule for SSH from your current IP
# - npm + node installed locally (matches the version in web/package.json)
# - rsync (bundled on macOS)

set -euo pipefail

# --------------- config ---------------

REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
KEY="$REPO_ROOT/pemkey/imerit-key.pem"
HOST="ubuntu@13.203.195.36"
REMOTE_WEB_DIST="/var/www/imerit/web/dist"
API_BASE="/api"

# --------------- args ---------------

DO_FRONTEND=true
DO_BACKEND=true
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --frontend) DO_BACKEND=false ;;
    --backend)  DO_FRONTEND=false ;;
    --dry-run)  DRY_RUN=true ;;
    -h|--help)
      grep -E '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      echo "See scripts/deploy.sh --help" >&2
      exit 1
      ;;
  esac
done

# --------------- pre-flight ---------------

if [[ ! -f "$KEY" ]]; then
  echo "❌ SSH key missing: $KEY"
  echo "   pemkey/ is gitignored — get the .pem from wherever you stashed it."
  exit 1
fi

# rsync + ssh must both be on PATH
for bin in rsync ssh; do
  command -v "$bin" >/dev/null || {
    echo "❌ Missing binary: $bin"
    exit 1
  }
done

# Warn if working tree is dirty — deploying uncommitted local changes
# from your Mac to the server is fine, but the backend git pull will
# NOT see them, so the two halves may diverge until you commit.
if [[ -n "$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)" ]]; then
  echo "⚠️  Working tree has uncommitted changes."
  echo "    Frontend will deploy your LOCAL build (with these changes)."
  echo "    Backend git pull will NOT include them until you commit + push."
  echo ""
fi

step() { echo -e "\n\033[1;34m▶︎ $1\033[0m"; }
run() {
  if $DRY_RUN; then
    echo "  [dry-run] $*"
  else
    "$@"
  fi
}

start_time=$(date +%s)

# --------------- frontend: local build + rsync ---------------

if $DO_FRONTEND; then
  step "Frontend — building locally"
  run bash -c "cd '$REPO_ROOT/web' && npm ci --prefer-offline --no-audit --no-fund"
  # Bake the API base into the build — matches server Nginx which
  # proxies /api/* to :4000. Same-origin, no CORS needed at runtime.
  run bash -c "cd '$REPO_ROOT/web' && VITE_API_URL=$API_BASE npm run build"

  step "Frontend — syncing dist/ to $HOST:$REMOTE_WEB_DIST"
  # --delete removes stale assets from the previous build (Vite's
  # content-hashed filenames would otherwise accumulate forever).
  # -a preserves perms; -z compresses on the wire. Use plain --progress
  # (not --info=progress2) because macOS ships the openrsync fork which
  # doesn't support the newer info= flag.
  run rsync -az --delete --progress \
    -e "ssh -i '$KEY' -o StrictHostKeyChecking=no" \
    "$REPO_ROOT/web/dist/" \
    "$HOST:$REMOTE_WEB_DIST/"
fi

# --------------- backend: git pull + tsc + pm2 restart on server ---------------

if $DO_BACKEND; then
  step "Backend — pulling + rebuilding on $HOST"
  # Run everything server-side in one SSH session. tsc + prisma migrate
  # are both light enough that they run cleanly on the t4g.small; the
  # OOM risk is entirely on vite, which we no longer run here.
  if $DRY_RUN; then
    echo "  [dry-run] ssh $HOST '<backend deploy sequence>'"
  else
    ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" "bash -s" <<'REMOTE'
set -euo pipefail
cd /var/www/imerit
git pull
cd backend
npm ci --prefer-offline --no-audit --no-fund
npx prisma migrate deploy
npm run build
pm2 restart api
echo ""
echo "--- pm2 status ---"
pm2 status | tail -3
REMOTE
  fi
fi

# --------------- done ---------------

end_time=$(date +%s)
duration=$((end_time - start_time))

if $DO_FRONTEND && ! $DRY_RUN; then
  # Print the bundle hash so you can eyeball that a new build actually
  # landed (Vite content-hashes every JS/CSS chunk).
  step "Bundle hash on server"
  ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST" \
    "ls -1 $REMOTE_WEB_DIST/assets/ | grep -E '^index-.*\.js$' | head -1"
fi

echo ""
echo "✅ Deploy finished in ${duration}s"
echo "   Live at https://itamilrecruit.net"
