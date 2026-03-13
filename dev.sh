#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
export NODE="/usr/local/bin/node"
export NODE_PATH="/usr/local/lib/node_modules"
exec "/usr/local/bin/node" "node_modules/next/dist/bin/next" dev
