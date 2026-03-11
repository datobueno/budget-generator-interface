#!/usr/bin/env bash
set -euo pipefail

NETWORK_CHECK=false
if [[ "${1:-}" == "--network" ]]; then
  NETWORK_CHECK=true
fi

echo "[doctor] package manager"
if [[ -f package-lock.json ]]; then
  echo "[error] package-lock.json presente (repo pnpm-only)."
  exit 1
fi
if [[ ! -f pnpm-lock.yaml ]]; then
  echo "[error] pnpm-lock.yaml no existe."
  exit 1
fi

echo "[doctor] node_modules integrity"
if [[ -d node_modules/.ignored ]]; then
  echo "[error] node_modules/.ignored detectado (mezcla de gestores)."
  exit 1
fi
if [[ ! -d node_modules/.pnpm ]]; then
  echo "[error] node_modules/.pnpm no existe."
  exit 1
fi

if ! find node_modules/.pnpm -path '*/node_modules/vite/dist/node/chunks/dep-D-*.js' -print -quit | grep -q .; then
  echo "[error] faltan chunks criticos de vite (dep-D-*)."
  exit 1
fi

echo "[doctor] vite import"
node -e "import('vite').then(()=>console.log('[ok] vite import')).catch(()=>process.exit(1))"

if [[ "$NETWORK_CHECK" == "true" ]]; then
  echo "[doctor] network"
  if ! nslookup registry.npmjs.org >/dev/null 2>&1; then
    echo "[error] DNS fail: registry.npmjs.org"
    exit 1
  fi
  if ! curl -Is https://registry.npmjs.org/ >/dev/null 2>&1; then
    echo "[error] HTTP fail: https://registry.npmjs.org/"
    exit 1
  fi
  echo "[ok] network npm registry"
fi

echo "[ok] doctor completado"
