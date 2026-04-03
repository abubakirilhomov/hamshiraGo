#!/bin/bash
# Run all pending migrations on the database
# Usage: DB_HOST=... DB_PORT=... DB_NAME=... DB_USERNAME=... DB_PASSWORD=... ./run-all.sh
# Or: source ../.env && ./run-all.sh

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -z "$DB_HOST" ]; then
  echo "Loading .env from parent directory..."
  if [ -f "$DIR/../.env" ]; then
    export $(grep -v '^#' "$DIR/../.env" | xargs)
  else
    echo "ERROR: No .env file found and DB_HOST not set"
    exit 1
  fi
fi

echo "=== Running migrations on ${DB_HOST}:${DB_PORT}/${DB_NAME} ==="

for f in "$DIR"/0*.sql; do
  echo "--- Running: $(basename $f) ---"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_NAME" -f "$f" 2>&1
  echo ""
done

echo "=== All migrations complete ==="
