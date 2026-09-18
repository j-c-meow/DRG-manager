#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "错误：未找到 Node.js。" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "错误：未找到 npm。" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "==> 安装锁定依赖"
  npm ci
fi

echo "==> 构建生产版本"
npm run build

[[ -f dist/index.html ]] || { echo "错误：缺少 dist/index.html。" >&2; exit 1; }
[[ -f dist/assets/generated/realtime-atlas.json ]] || {
  echo "错误：缺少实时图片图集。" >&2
  exit 1
}

echo "==> 部署到 Cloudflare Workers"
npx --no-install wrangler deploy "$@"
