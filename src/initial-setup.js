import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
import { hasParam } from './lib/has-param.js';

// Node's global fetch() ignores the http_proxy/https_proxy environment variables,
// unlike most CLI tools (curl, kubectl, s3cmd…). When such a variable is set, install
// an EnvHttpProxyAgent as the global dispatcher so every fetch() (API calls, update
// checks…) routes through the proxy and honors no_proxy for exclusions. We only swap
// the dispatcher when a proxy is actually configured, leaving the default behavior
// untouched for everyone else.
const hasProxyConfig =
  process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
if (hasProxyConfig) {
  setGlobalDispatcher(new EnvHttpProxyAgent());
}

// These need to be set before Logger and other stuffs
if (hasParam('-v') || hasParam('--verbose')) {
  process.env.CLEVER_VERBOSE = '1';
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
