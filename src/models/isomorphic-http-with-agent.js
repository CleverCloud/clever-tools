import * as git from 'isomorphic-git/http/node';
import http from 'node:http';
import https from 'node:https';

// We use our own HTTP plugin, so we can customize the agent used for requests and configure a long timeout (default is 5 seconds).

const KEEP_ALIVE_TIMEOUT = 10 * 60 * 1000;
const httpsAgent = new https.Agent({ keepAlive: true, timeout: KEEP_ALIVE_TIMEOUT });
const httpAgent = new http.Agent({ keepAlive: true, timeout: KEEP_ALIVE_TIMEOUT });

export function request(params) {
  const agent = params.url.startsWith('https:') ? httpsAgent : httpAgent;
  return git.request({ ...params, agent });
}
