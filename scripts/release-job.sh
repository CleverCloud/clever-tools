#!/usr/bin/env bash

set -euo pipefail

BUILD_ONLY=1 npm install nodegit
npm install
node scripts/build-release.js
