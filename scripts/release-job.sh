#!/usr/bin/env bash

set -euo pipefail

npm install
node scripts/build-release.js
