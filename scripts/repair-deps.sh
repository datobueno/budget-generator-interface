#!/usr/bin/env bash
set -euo pipefail

echo "[repair] clean"
rm -rf node_modules .pnpm-store
rm -f package-lock.json

echo "[repair] configure pnpm local store"
pnpm config set store-dir ./.pnpm-store --location=project >/dev/null

echo "[repair] install"
pnpm install --no-frozen-lockfile

echo "[repair] verify"
bash scripts/doctor.sh
pnpm run build

echo "[ok] dependencias reparadas"
