import isomotphicHttp from 'isomorphic-git/http/node/index.js';
import https from 'node:https';

// We use our own HTTP plugin, so we can customize the agent used for requests and configure a long timeout (default is 5 seconds).

const agent = new https.Agent({
  keepAlive: true,
  timeout: 10 * 60 * 1000,
});

export function request (params) {
  return isomotphicHttp.request({ ...params, agent });
}
