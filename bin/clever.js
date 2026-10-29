#!/usr/bin/env node

// The compile cache only applies to the modules loaded after this call, so the CLI is imported afterwards
import { enableCompileCache } from 'node:module';
import path from 'node:path';
import { getCacheDir } from '../src/config/paths.js';

// In the cache directory of the user: a shared temporary directory could hold bytecode written by another user
enableCompileCache(path.join(getCacheDir(), 'compile-cache'));

import('../src/cli.js');
