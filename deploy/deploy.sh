#!/usr/bin/env bash
#
# Deploy mauzodata-pro to this server.
#
# Run on the SERVER, from the project root:
#   bash deploy/deploy.sh            # normal deploy
#   bash deploy/deploy.sh --dry-run  # show what would happen, touch nothing
#
# What today's outage taught this script, on purpose:
#   - it never changes umask. The project directories are setgid with a
#     default umask of 0002, which already produces group- and
#     world-readable files (664/775) for anything created inside them.
#     A umask tightened for one step (protecting a DB-credentials file)
#     leaked into every later step last time and made the whole site
#     unreadable to the web server user. So: no umask anywhere here: file
#     permissions on anything sensitive are set with explicit chmod, never
#     inherited from shell state.
#   - it never trusts a command's own exit code as proof the site works.
#     The last outage's controller/tinker checks all "passed" because they
#     ran as the file owner, who could read everything that www-data
#     could not. The only checks that count here are real HTTP requests —
#     the last step curls /up, /login and the asset the login page itself
#     references, exactly as a browser would.
#   - it never rolls back automatically. On a failed verification it prints
#     the exact commands to do it by hand and stops. An automatic rollback
#     is itself a risky action taken under the same uncertainty that just
#     caused a failure, and deciding how to unwind (code only? does a
#     migration need reversing too?) needs a human looking at what actually
#     broke.
#
set -Eeuo pipefail

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

APP_URL="https://masinde.mauzodata.com"
BACKUP_DIR="$HOME/backups"
LOCK_FILE="/tmp/mauzodata-deploy.lock"
STARTED_AT="$(date '+%Y-%m-%d %H:%M:%S')"
DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# Everything temporary this run creates, cleaned up on any exit.
CLEANUP_PATHS=()
LOCK_HELD=0

cleanup() {
    local status=$?
    for p in "${CLEANUP_PATHS[@]:-}"; do
        [[ -n "$p" && -e "$p" ]] && rm -f "$p"
    done
    if [[ "$LOCK_HELD" == "1" ]]; then
        rmdir "$LOCK_FILE" 2>/dev/null || true
    fi
    exit "$status"
}
trap cleanup EXIT

fail() {
    echo
    echo "=========================================="
    echo "  DEPLOY FAILED: $*"
    echo "=========================================="
    exit 1
}

note() { echo "-- $*"; }

run() {
    # Echoes the command it's about to run so the transcript is a full
    # record of what touched production, then runs it for real.
    note "$*"
    if [[ "$DRY_RUN" == "1" ]]; then
        return 0
    fi
    "$@"
}

# ---------------------------------------------------------------------------
# Guard rails
# ---------------------------------------------------------------------------

note "mauzodata-pro deploy — started $STARTED_AT $( [[ "$DRY_RUN" == "1" ]] && echo '(DRY RUN)' )"

# One deploy at a time. A stale lock (a previous run that crashed hard
# enough to skip the trap) is reported rather than silently overridden.
if ! mkdir "$LOCK_FILE" 2>/dev/null; then
    fail "another deploy looks like it's already running (found $LOCK_FILE — remove it by hand once you're sure nothing is running)"
fi
LOCK_HELD=1

[[ -f "artisan" && -f ".env" ]] || fail "this doesn't look like the app root ($APP_ROOT) — no artisan/.env here"

APP_ENV_VALUE="$(grep -m1 '^APP_ENV=' .env | cut -d= -f2- || true)"
[[ "$APP_ENV_VALUE" == "production" ]] || fail "APP_ENV is '$APP_ENV_VALUE', not production — refusing to run a production deploy against this"

# A server deploys whichever branch it is checked out on, but only one this
# script recognises. Most installations track main; one that runs a client's
# custom build (masinde, which carries the logistics system on top of main)
# tracks that instead. The allowlist is what stops a stray checkout — a
# half-finished feature branch, a detached HEAD after a manual fix — from
# being deployed to a live site by a script that was only asked to "deploy".
DEPLOYABLE_BRANCHES=("main" "masinde")

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

branch_is_deployable() {
    local candidate
    for candidate in "${DEPLOYABLE_BRANCHES[@]}"; do
        [[ "$CURRENT_BRANCH" == "$candidate" ]] && return 0
    done
    return 1
}

branch_is_deployable || fail "on branch '$CURRENT_BRANCH', which is not one this script deploys (${DEPLOYABLE_BRANCHES[*]}).
If this server is meant to track a different branch, check it out by hand and
verify the site before deploying — switching branches mid-deploy is not
something this script will do for you."

note "deploying branch '$CURRENT_BRANCH'"

if [[ -n "$(git status --porcelain)" ]]; then
    fail "the working tree has local changes — a deploy must start from a clean checkout:
$(git status --short)"
fi

BEFORE_SHA="$(git rev-parse HEAD)"
BEFORE_LOG_LINES="$(wc -l < storage/logs/laravel.log 2>/dev/null || echo 0)"

# ---------------------------------------------------------------------------
# 1. Back up the database — before anything else can touch it.
# ---------------------------------------------------------------------------

note "Step 1/7: database backup"

db_env() { grep -m1 "^${1}=" .env | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
DB_HOST="$(db_env DB_HOST)"
DB_PORT="$(db_env DB_PORT)"
DB_DATABASE="$(db_env DB_DATABASE)"
DB_USERNAME="$(db_env DB_USERNAME)"
DB_PASSWORD="$(db_env DB_PASSWORD)"
[[ -n "$DB_DATABASE" && -n "$DB_USERNAME" ]] || fail "could not read DB_DATABASE / DB_USERNAME from .env"

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%F-%H%M%S).sql.gz"

# The credentials file's privacy comes from an explicit chmod on the exact
# file, not from umask — so nothing else in this script is affected by it.
CNF_FILE="$(mktemp /tmp/mauzodata-deploy-db.XXXXXX.cnf)"
CLEANUP_PATHS+=("$CNF_FILE")
chmod 600 "$CNF_FILE"
{
    echo "[client]"
    echo "host=${DB_HOST:-127.0.0.1}"
    echo "port=${DB_PORT:-3306}"
    echo "user=$DB_USERNAME"
    echo "password=\"$DB_PASSWORD\""
} > "$CNF_FILE"

if [[ "$DRY_RUN" == "1" ]]; then
    note "(dry run) would mysqldump $DB_DATABASE -> $BACKUP_FILE"
else
    mysqldump --defaults-extra-file="$CNF_FILE" --single-transaction --quick --routines "$DB_DATABASE" \
        | gzip > "$BACKUP_FILE" \
        || fail "mysqldump failed — nothing else has run, production is untouched"

    gzip -t "$BACKUP_FILE" || fail "backup file is corrupt (gzip -t failed) — aborting before touching anything"
    zcat "$BACKUP_FILE" | tail -3 | grep -q "Dump completed" \
        || fail "backup does not end with 'Dump completed' — it may be truncated, aborting"

    BACKUP_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
    note "backup OK: $BACKUP_FILE ($BACKUP_SIZE)"
fi

# ---------------------------------------------------------------------------
# 2. Pull — fast-forward only. A diverged history stops here rather than
#    being force-merged over.
# ---------------------------------------------------------------------------

note "Step 2/7: git pull"
# Fetch is read-only, so it runs for real even in a dry run — that's how a
# dry run can accurately report what it WOULD pull.
git fetch origin "$CURRENT_BRANCH"

git merge-base --is-ancestor "$BEFORE_SHA" "origin/$CURRENT_BRANCH" \
    || fail "local $CURRENT_BRANCH is not an ancestor of origin/$CURRENT_BRANCH — history has diverged, this needs a human, not this script"

REMOTE_SHA="$(git rev-parse "origin/$CURRENT_BRANCH")"

if [[ "$REMOTE_SHA" == "$BEFORE_SHA" ]]; then
    note "already up to date at $BEFORE_SHA — nothing to deploy"
    if [[ "$DRY_RUN" == "0" ]]; then
        note "(the database backup above still happened and is kept)"
    fi
    exit 0
fi

if [[ "$DRY_RUN" == "1" ]]; then
    note "(dry run) would fast-forward $BEFORE_SHA -> $REMOTE_SHA:"
    git log --oneline "$BEFORE_SHA..$REMOTE_SHA" | sed 's/^/     /'
    CHANGED_FILES="$(git diff --name-only "$BEFORE_SHA" "$REMOTE_SHA")"
    AFTER_SHA="$REMOTE_SHA"
else
    git pull --ff-only origin "$CURRENT_BRANCH"
    AFTER_SHA="$(git rev-parse HEAD)"
    CHANGED_FILES="$(git diff --name-only "$BEFORE_SHA" "$AFTER_SHA")"
fi

note "deploying $BEFORE_SHA -> $AFTER_SHA"

# ---------------------------------------------------------------------------
# 3. Dependencies — only reinstall what actually changed.
# ---------------------------------------------------------------------------

note "Step 3/7: dependencies"

if grep -q '^composer.lock$' <<< "$CHANGED_FILES"; then
    run composer install --no-dev --optimize-autoloader --no-interaction
else
    note "composer.lock unchanged — skipping composer install"
fi

if grep -qE '^(package-lock\.json|package\.json)$' <<< "$CHANGED_FILES"; then
    run npm ci --no-audit --no-fund
else
    note "package-lock.json unchanged — skipping npm ci"
fi

# ---------------------------------------------------------------------------
# 4. Migrations — artisan only applies what's pending; safe to always run.
# ---------------------------------------------------------------------------

note "Step 4/7: migrations"
run php artisan migrate --force

# ---------------------------------------------------------------------------
# 5. Build assets and rebuild caches.
# ---------------------------------------------------------------------------

note "Step 5/7: build & cache"
run npm run build
run php artisan optimize:clear
run php artisan config:cache
run php artisan route:cache
run php artisan view:cache

# ---------------------------------------------------------------------------
# 6. Permissions — a belt-and-suspenders pass, scoped tightly on purpose:
#    only files git actually tracks (so .env and anything under storage/app
#    are never touched) plus the three directories a build/cache step
#    writes into. No -R over the whole tree, no umask, ever.
# ---------------------------------------------------------------------------

note "Step 6/7: permissions"
if [[ "$DRY_RUN" == "0" ]]; then
    git ls-files -z | xargs -0 -r chmod g+rX,o+rX
    git ls-files -z | xargs -0 -r -n1 dirname | sort -u | xargs -r chmod g+rx,o+rx
    chmod -R g+rX,o+rX bootstrap/cache storage/framework/views public/build 2>/dev/null || true
    note "permissions normalised on tracked files + bootstrap/cache, storage/framework/views, public/build"
else
    note "(dry run) would chmod tracked files + bootstrap/cache, storage/framework/views, public/build"
fi

run php artisan queue:restart

# ---------------------------------------------------------------------------
# 7. Verify — the only thing that gets to call this a success. Real HTTP
#    requests, exactly as a browser makes them; no SSH-local checks count.
# ---------------------------------------------------------------------------

note "Step 7/7: verify"

if [[ "$DRY_RUN" == "1" ]]; then
    note "(dry run) would verify $APP_URL/up, $APP_URL/login and its referenced JS bundle"
    note "dry run complete — nothing was changed"
    exit 0
fi

sleep 1  # let opcache/route cache settle before hammering it

check_http() {
    local url="$1" want="$2"
    local got
    got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo "000")"
    if [[ "$got" != "$want" ]]; then
        fail "verification failed: $url returned HTTP $got, expected $want.
The code is live at $AFTER_SHA but did NOT pass verification.
It was $BEFORE_SHA before this deploy. To roll the CODE back by hand:
    cd $APP_ROOT
    git reset --hard $BEFORE_SHA
    composer install --no-dev --optimize-autoloader --no-interaction
    npm run build
    php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache
Look at storage/logs/laravel.log first — the actual error is more useful
than guessing, and if a migration ran in step 4 a code-only rollback may
not be enough. This script does not do that step for you on purpose."
    fi
    note "  $url -> $got OK"
}

check_http "$APP_URL/up" "200"
check_http "$APP_URL/login" "200"

LOGIN_HTML="$(curl -s --max-time 20 "$APP_URL/login" || true)"
ASSET_PATH="$(grep -oE '/build/assets/app-[A-Za-z0-9_-]+\.js' <<< "$LOGIN_HTML" | head -1 || true)"
if [[ -z "$ASSET_PATH" ]]; then
    fail "verification failed: could not find a /build/assets/app-*.js reference in the /login page.
That page is not rendering as a real Inertia page — check storage/logs/laravel.log.
Code is live at $AFTER_SHA (was $BEFORE_SHA); see the rollback steps above."
fi
check_http "${APP_URL}${ASSET_PATH}" "200"

AFTER_LOG_LINES="$(wc -l < storage/logs/laravel.log 2>/dev/null || echo 0)"
NEW_ERRORS="$(tail -n "+$((BEFORE_LOG_LINES + 1))" storage/logs/laravel.log 2>/dev/null | grep -c 'production.ERROR' || true)"
NEW_ERRORS="${NEW_ERRORS:-0}"
if [[ "$NEW_ERRORS" != "0" ]]; then
    fail "verification failed: $NEW_ERRORS new production.ERROR line(s) appeared in storage/logs/laravel.log during this deploy, even though the HTTP checks passed.
$(tail -n "+$((BEFORE_LOG_LINES + 1))" storage/logs/laravel.log | grep 'production.ERROR' | tail -5)
Code is live at $AFTER_SHA (was $BEFORE_SHA); see the rollback steps above."
fi

echo
echo "=========================================="
echo "  DEPLOY OK"
echo "  $BEFORE_SHA -> $AFTER_SHA"
echo "  backup: $BACKUP_FILE"
echo "  verified: /up, /login, ${ASSET_PATH}"
echo "  finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
