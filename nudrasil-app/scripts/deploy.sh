#!/bin/bash
set -e

export PATH="$PATH:/home/rocko/.nvm/versions/node/v23.11.0/bin"

DEPLOY_PATH="/home/rocko/deploy/nudrasil-live"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ">> Stop old app (if running)…"
pm2 stop nextjs-app || true

echo ">> Clean and copy new build…"
rm -rf "$DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"

# 1️⃣  Entire standalone bundle (includes server.js + node_modules + nested .next)
cp -R "$SOURCE/.next/standalone/." "$DEPLOY_PATH/"

# 2️⃣  public/ alongside server.js
cp -R "$SOURCE/public" "$DEPLOY_PATH/public"

# 3️⃣  outer .next/static
mkdir -p "$DEPLOY_PATH/.next"
cp -R "$SOURCE/.next/static" "$DEPLOY_PATH/.next/static"

# 4️⃣  required JSON manifests
for f in BUILD_ID routes-manifest.json prerender-manifest.json required-server-files.json; do
  cp "$SOURCE/.next/$f" "$DEPLOY_PATH/.next/$f"
done
if [ -f "$SOURCE/.next/server/pages-manifest.json" ]; then
  mkdir -p "$DEPLOY_PATH/.next/server"
  cp "$SOURCE/.next/server/pages-manifest.json" "$DEPLOY_PATH/.next/server/"
fi

# 5️⃣  runtime config / PM2 file
cp "$SOURCE/.env.production"        "$DEPLOY_PATH/.env"
cp "$SOURCE/ecosystem.config.cjs"   "$DEPLOY_PATH/"

echo ">> Start new version with PM2…"
cd "$DEPLOY_PATH"
pm2 delete nextjs-app       || true     # remove old definition if present
pm2 start ecosystem.config.cjs --only nextjs-app
pm2 save

echo "✅  New version is now live!"
