#!/bin/bash
cd /workspace/ncd-care-plus
python3 run_node.py /tmp/node-v20.11.0-linux-x64/lib/node_modules/npm/bin/npm-cli.js "$@"
