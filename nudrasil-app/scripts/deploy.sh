#!/bin/bash

# Add PM2 to PATH
export PATH="$PATH:/home/rocko/.nvm/versions/node/v23.11.0/bin"

set -e

DEPLOY_PATH="/home/rocko/deploy/nudrasil-live"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo ">> Stop old app if running..."
pm2 stop nextjs-app || true

echo ">> Clean and copy new build..."
rm -rf "$DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"

# Copy the standalone server.js and node_modules
cp -r "$SOURCE/.next/standalone/"* "$DEPLOY_PATH/"

# Copy public/ folder next to server.js
cp -r "$SOURCE/public" "$DEPLOY_PATH/public"

# Copy static assets inside .next/static
mkdir -p "$DEPLOY_PATH/.next"
cp -r "$SOURCE/.next/static" "$DEPLOY_PATH/.next/static"

# Copy your ecosystem config and env file
cp "$SOURCE/ecosystem.config.cjs" "$DEPLOY_PATH/"
cp "/home/rocko/deploy/.env.production" "$DEPLOY_PATH/.env"

echo ">> Start new version with PM2..."
cd "$DEPLOY_PATH"
pm2 start ecosystem.config.cjs --only nextjs-app
pm2 save

echo "✅ New version is now live!"
