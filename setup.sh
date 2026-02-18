#!/bin/bash
# NCD-Care+ Setup Script
# Run this on the host to install dependencies and build

set -e

cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building..."
npm run build

echo "✅ Build complete! Output in ./out/"
echo "📂 To serve: npx serve out/"
