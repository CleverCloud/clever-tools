#!/usr/bin/env node

// The compile cache only applies to the modules loaded after this call, so the CLI is imported afterwards
import { enableCompileCache } from 'node:module';
import path from 'node:path';
import { getCacheDir } from '../src/config/paths.js';

// In the cache directory of the user: a shared temporary directory could hold bytecode written by another user
// The cache is optional, it must never prevent the CLI from starting
try {
  enableCompileCache(path.join(getCacheDir(), 'compile-cache'));
} catch {
  // No usable cache directory (HOME unset, for instance): run without the compile cache
}

import('../src/cli.js');
