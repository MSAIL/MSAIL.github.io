#!/usr/bin/env bash
# Deploy msail.github.io.
#
# What it does: verify locally -> push main (which triggers
# .github/workflows/deploy.yml) -> watch the Actions run -> smoke-test
# production. If there is nothing new to push, it offers to re-deploy the
# current commit via workflow_dispatch instead.
#
# Usage: npm run deploy   (or: bash scripts/deploy.sh)
set -euo pipefail

REPO="MSAIL/MSAIL.github.io"
BRANCH="main"
WORKFLOW="Deploy to GitHub Pages"
SITE="https://msail.github.io"

say() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
die() { printf 'deploy: %s\n' "$*" >&2; exit 1; }

cd "$(git rev-parse --show-toplevel)"

# --- preconditions -----------------------------------------------------------
command -v gh >/dev/null 2>&1 || die "needs the GitHub CLI: brew install gh"
gh auth status >/dev/null 2>&1 || die "gh is not authenticated: run 'gh auth login'"
[ -d node_modules ] || die "dependencies not installed — run 'npm ci' first"

current=$(git branch --show-current)
[ "$current" = "$BRANCH" ] || die "deploys ship from '$BRANCH' (you are on '$current')"

upstream=$(git config "branch.$BRANCH.merge" 2>/dev/null || true)
[ "$upstream" = "refs/heads/$BRANCH" ] || die \
  "branch '$BRANCH' tracks '$upstream', not origin/$BRANCH — fix once with: git branch --set-upstream-to=origin/$BRANCH $BRANCH"

if [ -n "$(git status --porcelain)" ]; then
  git status --short >&2
  die "working tree not clean — commit or stash first"
fi

# --- remote state first, so divergence fails in seconds, not after a build ---
head_sha=$(git rev-parse HEAD)
remote_sha=$(git ls-remote origin "refs/heads/$BRANCH" | cut -f1)
if [ -n "$remote_sha" ] && [ "$head_sha" != "$remote_sha" ]; then
  git fetch -q origin "$BRANCH"
  git merge-base --is-ancestor "$remote_sha" HEAD || die \
    "origin/$BRANCH has commits you don't have — run 'git pull --rebase origin $BRANCH' first"
fi

# --- local gate: types + lint + build (CI re-runs lint + build) ---------------
say "Type-checking"
npx --no-install tsc --noEmit

say "Linting"
npm run lint

say "Building"
npm run build

# --- push (triggers the Pages workflow), or re-dispatch the same commit ------
# baseline_id: newest run that existed BEFORE we trigger anything, so the poll
# below can't latch onto a previous run for the same commit.
baseline_id=0
if [ "$head_sha" = "$remote_sha" ]; then
  say "Nothing new to push"
  printf 'origin/%s is already at %s.\nRe-deploy this commit anyway? [y/N] ' "$BRANCH" "${head_sha:0:7}"
  read -r answer || die "stdin is not interactive — to re-deploy run: gh workflow run \"$WORKFLOW\" -R $REPO --ref $BRANCH"
  case "$answer" in
    y|Y)
      baseline_id=$(gh run list -R "$REPO" --branch "$BRANCH" --workflow "$WORKFLOW" \
        --limit 1 --json databaseId -q '.[0].databaseId // 0' 2>/dev/null) || baseline_id=0
      gh workflow run "$WORKFLOW" -R "$REPO" --ref "$BRANCH"
      ;;
    *) die "aborted" ;;
  esac
else
  say "Pushing $BRANCH"
  git push origin "$BRANCH"
fi

# --- find and watch the workflow run for THIS trigger -------------------------
say "Waiting for the Pages deploy"
run_id=""
for _ in $(seq 1 30); do
  run_id=$(gh run list -R "$REPO" --branch "$BRANCH" --workflow "$WORKFLOW" \
    --limit 5 --json databaseId,headSha \
    -q "[.[] | select(.headSha == \"$head_sha\" and .databaseId > $baseline_id)][0].databaseId // empty" \
    2>/dev/null) || true
  [ -n "$run_id" ] && break
  sleep 2
done
[ -n "$run_id" ] || die "no workflow run appeared for ${head_sha:0:7} — check: gh run list -R $REPO"

if ! gh run watch "$run_id" -R "$REPO" --exit-status; then
  conclusion=$(gh run view "$run_id" -R "$REPO" --json conclusion -q .conclusion 2>/dev/null) || conclusion="unknown"
  case "$conclusion" in
    failure|cancelled|timed_out)
      die "run $run_id ended '$conclusion' — logs: gh run view $run_id -R $REPO --log-failed" ;;
    *)
      die "lost track of run $run_id (gh/network hiccup; it may still be running). Resume with: gh run watch $run_id -R $REPO --exit-status" ;;
  esac
fi

# --- smoke-test production ----------------------------------------------------
say "Smoke-testing $SITE"
fail=0 unreachable=0 total=0
for path in / /about/ /talks/ /resources/ /alumni/ /constitution/ /join/ /sitemap.xml /robots.txt /aboutus/; do
  total=$((total + 1))
  code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$SITE$path") || code="000"
  printf '  %-16s %s\n' "$path" "$code"
  [ "$code" = "000" ] && unreachable=$((unreachable + 1))
  [ "$code" = "200" ] || fail=1
done
if [ "$unreachable" -eq "$total" ]; then
  die "could not reach $SITE from this machine — the Actions run succeeded, so the deploy is likely fine; check your network"
fi
[ "$fail" -eq 0 ] || die "smoke test failed — the deploy ran but the URLs above are wrong; investigate before shipping more"

say "Deployed $SITE @ ${head_sha:0:7}"
