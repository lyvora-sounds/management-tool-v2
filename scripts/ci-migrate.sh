#!/usr/bin/env bash
# Release step: applies pending Prisma migrations against the direct (unpooled) Neon URL, before a new image is
# rolled out. It never runs inside `next build` or when the container starts.
#
# Safety checks, in this order:
#   1. It reads the migration status first. If the status cannot be read (cannot connect, failed migration), the
#      step fails instead of assuming there is nothing to do.
#   2. If a pending migration contains a destructive statement (DROP TABLE/COLUMN/SCHEMA, TRUNCATE, DELETE FROM,
#      a column type change), the step fails, because old instances keep running against the new schema while a
#      deploy rolls out. Set ALLOW_DESTRUCTIVE=1 to let it through, after splitting the change in two releases.
#   3. Only then does it run `prisma migrate deploy`, which is idempotent: with nothing pending it does nothing,
#      so it coexists with the migration Vercel still runs during its own build.
#
# Needs DATABASE_URL_UNPOOLED in the environment.
set -euo pipefail

: "${DATABASE_URL_UNPOOLED:?DATABASE_URL_UNPOOLED is not set}"

migrations_dir="${MIGRATIONS_DIR:-prisma/migrations}"
prisma="${PRISMA_CMD:-pnpm exec prisma}"

mask() { sed -E 's#(postgres(ql)?://)[^@[:space:]]+@#\1***@#g'; }

status="$($prisma migrate status 2>&1 || true)"
printf '%s\n' "$status" | mask

# Names of the migrations that exist in the repository but not in the database.
pending="$(printf '%s\n' "$status" | awk '/have not yet been applied|has not yet been applied/ {f=1; next} f && /^[[:space:]]*[0-9]{14}_/ {print $1} f && /^[[:space:]]*$/ {f=0}')"

if [ -z "$pending" ]; then
  if printf '%s\n' "$status" | grep -qi "up to date"; then
    echo "No pending migrations."
    exit 0
  fi
  echo "::error::Could not read the migration status (cannot connect, or a failed migration). Not deploying." >&2
  exit 1
fi

echo "Pending migrations:"
printf '  %s\n' $pending

destructive='DROP[[:space:]]+(TABLE|COLUMN|SCHEMA|DATABASE|INDEX)|TRUNCATE|DELETE[[:space:]]+FROM|ALTER[[:space:]]+COLUMN[^;]*[[:space:]]TYPE'
blocked=0
for name in $pending; do
  file="$migrations_dir/$name/migration.sql"
  if [ -f "$file" ] && grep -Eiq "$destructive" "$file"; then
    echo "::error file=$file::Destructive statement in a pending migration." >&2
    grep -Eino "$destructive" "$file" | head -5 >&2
    blocked=1
  fi
done

if [ "$blocked" = 1 ] && [ "${ALLOW_DESTRUCTIVE:-0}" != 1 ]; then
  echo "::error::Refusing to apply a destructive migration automatically. Split it into two releases, or add [allow-destructive-migration] to the commit message to let this one through." >&2
  exit 1
fi

$prisma migrate deploy 2>&1 | mask
