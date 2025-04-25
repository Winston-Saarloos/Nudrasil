#!/bin/bash

set -e  # Exit on any error

DEPLOY_PATH="/home/rocko/deploy/nudrasil-live"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$SOURCE/.next/standalone"
ENV_SOURCE="/home/rocko/deploy/.env.production"
ENV_DEST="$DEPLOY_PATH/.env"

echo ">> Stop old app (if running)..."
pm2 stop nextjs-app || true  # Don't fail if app isn't running

echo ">> Clean and copy new build..."
if [ -d "$DEPLOY_PATH" ]; then
  rm -rf "$DEPLOY_PATH"/*
else
  mkdir -p "$DEPLOY_PATH"
fi

# Copy build output
cp -r "$BUILD/"* "$DEPLOY_PATH"

# Ensure deep paths exist before copying
mkdir -p "$DEPLOY_PATH/node_modules"
cp -r "$BUILD/node_modules" "$DEPLOY_PATH/node_modules"

mkdir -p "$DEPLOY_PATH/.next"
cp -r "$SOURCE/.next/static" "$DEPLOY_PATH/.next/static"

mkdir -p "$DEPLOY_PATH/public"
cp -r "$SOURCE/public" "$DEPLOY_PATH/public"

cp "$SOURCE/ecosystem.config.cjs" "$DEPLOY_PATH"

# Copy .env
echo ">> Copying environment config (.env.production -> .env)..."
cp "$ENV_SOURCE" "$ENV_DEST"

echo ">> Start new version with PM2..."
cd "$DEPLOY_PATH"
pm2 start ecosystem.config.cjs --only nextjs-app
pm2 save

echo "New version is now live!"
