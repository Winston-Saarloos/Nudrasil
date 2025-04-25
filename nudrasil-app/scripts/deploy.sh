#!/bin/bash

# Add PM2 to PATH
export PATH="$PATH:/home/rocko/.nvm/versions/node/v23.11.0/bin"

set -e  # Exit on any error

DEPLOY_PATH="/home/rocko/deploy/nudrasil-live"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$SOURCE/.next/standalone"
ENV_SOURCE="/home/rocko/deploy/.env.production"
ENV_DEST="$DEPLOY_PATH/.env"

echo ">> Stop old app (if running)..."
pm2 stop nextjs-app || true

echo ">> Clean and copy new build..."
if [ -d "$DEPLOY_PATH" ]; then
  rm -rf "$DEPLOY_PATH"/*
else
  mkdir -p "$DEPLOY_PATH"
fi

# Copy standalone build
cp "$BUILD/server.js" "$DEPLOY_PATH"
cp -r "$BUILD/node_modules" "$DEPLOY_PATH/node_modules"

# Copy .next/static correctly
mkdir -p "$DEPLOY_PATH/.next"
cp -r "$SOURCE/.next/static" "$DEPLOY_PATH/.next/

# Copy public assets + config
cp -r "$SOURCE/public" "$DEPLOY_PATH/public"
cp "$SOURCE/ecosystem.config.cjs" "$DEPLOY_PATH"

# Copy environment config
echo ">> Copying environment config (.env.production -> .env)..."
cp "$ENV_SOURCE" "$ENV_DEST"

echo ">> Start new version with PM2..."
cd "$DEPLOY_PATH"
pm2 start ecosystem.config.cjs --only nextjs-app
pm2 save

echo "✅ New version is now live!"
