#!/bin/sh
# Runs WordPress's Theme Check plugin on the active theme and fails on any
# REQUIRED or WARNING result (INFO results are printed but allowed).
cd "$(dirname "$0")"
out=$(docker compose exec -T cli wp theme-check run tagkit 2>&1 | sed 's/<[^>]*>//g')
echo "$out"
if echo "$out" | grep -qE '^(REQUIRED|WARNING)'; then
  echo "Theme Check found problems."
  exit 1
fi
echo "Theme Check passed."
