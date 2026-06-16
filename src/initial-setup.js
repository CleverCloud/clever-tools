import { hasParam } from './lib/has-param.js';

// These need to be set before Logger and other stuffs
if (hasParam('-v') || hasParam('--verbose')) {
  process.env.CLEVER_VERBOSE = '1';
}

// This needs to be set before any TLS connection is opened (fetch, isomorphic-git, ...)
// Useful behind corporate proxies that intercept TLS with their own certificates
if (hasParam('--insecure') || process.env.CLEVER_INSECURE != null) {
  process.env.CLEVER_INSECURE = '1';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// These need to be set before Logger and other stuffs
// Don't log anything in autocomplete mode
if (hasParam('--autocomplete-index')) {
  process.env.CLEVER_QUIET = '1';
}

// These need to be set before other stuffs
const colorExplicitFalse = hasParam('--no-color') || hasParam('--color', 'false');
const colorExplicitTrue = hasParam('--color', 'true');
if (colorExplicitFalse || (!process.stdout.isTTY && !colorExplicitTrue)) {
  process.env.NO_COLOR = '1';
}
