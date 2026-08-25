#!/usr/bin/env bash
set -euo pipefail

supabase start
docker exec -i supabase_db_job-tracker-local psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < supabase/tests/bootstrap/initial_schema.psql
supabase migration up --local
