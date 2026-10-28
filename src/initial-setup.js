import { hasParam } from './lib/has-param.js';
import { IS_COLOR_DISABLED, VALID_FORCE_COLOR_VALUES } from './lib/style-text.js';

// Node's global fetch() ignores the http_proxy/https_proxy environment variables,
// unlike most CLI tools (curl, kubectl, s3cmd…). When such a variable is set, install
// an EnvHttpProxyAgent as the global dispatcher so every fetch() (API calls, update
// checks…) routes through the proxy and honors no_proxy for exclusions. We only swap
// the dispatcher when a proxy is actually configured, leaving the default behavior
// untouched for everyone else.
// `undici` is about 110 files, so it is imported only when a proxy is configured, and the entry point
// has to await this function before its first fetch().
export async function setupProxy() {
  const hasProxyConfig =
    process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (hasProxyConfig) {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import('undici');
    setGlobalDispatcher(new EnvHttpProxyAgent());
  }
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
// Dependencies and child processes read these variables, they don't know about IS_COLOR_DISABLED
// FORCE_COLOR is the only one all of them understand (chalk in update-notifier ignores NO_COLOR),
// and Node warns when both are set
// When colors are enabled, a valid FORCE_COLOR set by the user (1, 2, 3, true or empty) is kept to preserve the requested color depth
// Otherwise (unset, 0, false, invalid) it is set to 1, so that --color true wins over FORCE_COLOR=0
if (IS_COLOR_DISABLED) {
  process.env.FORCE_COLOR = '0';
} else if (!VALID_FORCE_COLOR_VALUES.includes(process.env.FORCE_COLOR)) {
  process.env.FORCE_COLOR = '1';
}
delete process.env.NO_COLOR;
