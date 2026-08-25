#!/usr/bin/env bash
#
# Build the site locally and publish it to the VPS.
#
# The VPS has no Python and no mkdocs — it only ever holds the built output.
# Everything is built here and rsync'd across.
#
#   ./deploy/publish.sh            # dry run: shows exactly what would change
#   ./deploy/publish.sh --apply    # actually publish
#
# Dry run is the default on purpose: this uses --delete against a live web root.
#
set -euo pipefail

REMOTE="vps-79tech-deploy"
REMOTE_PATH="/var/www/madhusudansingh_rathore_portfolio"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$REPO/site"

# Files that live on the server but are NOT produced by mkdocs. --delete would
# otherwise remove them. portfolio.html is a hand-written standalone page that
# predates the docs site; deleting it is silent and unrecoverable.
PROTECTED=(
  "portfolio.html"
)

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

cd "$REPO"

echo "==> Building"
.venv/bin/mkdocs build --clean

# Guard against publishing a broken or empty build. rsync --delete against an
# empty source would wipe the live site.
[[ -f "$BUILD_DIR/index.html" ]] || { echo "FATAL: no index.html in $BUILD_DIR"; exit 1; }
COUNT=$(find "$BUILD_DIR" -name '*.html' | wc -l | tr -d ' ')
(( COUNT >= 20 )) || { echo "FATAL: only $COUNT html files built — refusing to publish"; exit 1; }
echo "    $COUNT html pages"

RSYNC_ARGS=(
  -az --delete --human-readable --itemize-changes
  --exclude='.DS_Store'
)
for f in "${PROTECTED[@]}"; do
  RSYNC_ARGS+=( --exclude="$f" )
done

if (( APPLY )); then
  echo "==> Publishing to $REMOTE:$REMOTE_PATH"
else
  echo "==> DRY RUN (nothing will change — re-run with --apply to publish)"
  RSYNC_ARGS+=( --dry-run )
fi

rsync "${RSYNC_ARGS[@]}" "$BUILD_DIR/" "$REMOTE:$REMOTE_PATH/"

if (( APPLY )); then
  echo "==> Verifying"
  for p in "/" "/Database/indexing/" "/does-not-exist/"; do
    printf '    %-28s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "https://themadhu.dev$p")"
  done
  echo "    (expect 200, 200, 404)"
else
  echo
  echo "Legend: '<' send  'deleting' remove from server.  Review, then --apply."
fi
