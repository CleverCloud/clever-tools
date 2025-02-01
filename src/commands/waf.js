import { enableWaf } from '../models/waf.js';

export async function enable (params) {
  const [addonIdOrName, route, destination] = params.args;

  await enableWaf(addonIdOrName, route, destination);
}

export async function disable (params) {
  const [addonIdOrName, route, destination] = params.args;

  await enableWaf(addonIdOrName, route, destination);
}

export async function get (params) {

}
