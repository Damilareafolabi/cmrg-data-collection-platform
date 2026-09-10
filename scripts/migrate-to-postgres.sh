#!/usr/bin/env bash
# ========================================================
# CMRG Survey — PostgreSQL Migration Runner
# ========================================================
set -e

echo "=== CMRG Survey Database Migration ==="

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  echo "Example: export DATABASE_URL='postgresql://user:pass@localhost:5432/cmrg_survey'"
  exit 1
fi

echo "Connecting to database and applying schema: database/schema.sql"
psql "$DATABASE_URL" -f database/schema.sql

echo "✓ Schema applied successfully."
echo "✓ Initial seed data and admin accounts initialized."
