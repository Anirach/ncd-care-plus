#!/bin/bash
# Deploy built output from /tmp to workspace
# Run: bash deploy.sh
set -e
cd "$(dirname "$0")"

if [ -f /tmp/ncd-care-plus-out.tar.gz ]; then
    echo "Extracting pre-built output..."
    tar xzf /tmp/ncd-care-plus-out.tar.gz
    echo "✅ Deployed! Files in ./out/"
else
    echo "No pre-built output found. Building from source..."
    npm install
    npm run build
    echo "✅ Built! Files in ./out/"
fi
