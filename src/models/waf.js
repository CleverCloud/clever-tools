import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { getOtoroshiApiParams, sendToOtoroshi } from './otoroshi.js';
import { createRoute, createWaf, getRouteTemplate, getWafTemplate } from './otoroshi-instances-api.js';

export async function enableWaf (addonIdOrName, pathToProtect, destination) {
  const otoroshi = await getOtoroshiApiParams(addonIdOrName);

  const responseTemplate = await getWafTemplate(otoroshi).then(sendToOtoroshi);
  const waf = await responseTemplate.json();
  waf.name = pathToProtect;
  waf.description = `WAF for ${pathToProtect}`;

  const responseWafConfig = await createWaf(otoroshi, waf).then(sendToOtoroshi);
  const createdWafConfig = await responseWafConfig.json();

  const wafPlugin = {
    enabled: true,
    debug: false,
    plugin: 'cp:otoroshi.wasm.proxywasm.NgCorazaWAF',
    config: {
      ref: createdWafConfig.id,
    },
  };

  const [hostname, ...path] = destination.split('/');
  const responseRoute = await getRouteTemplate(otoroshi).then(sendToOtoroshi);
  const route = await responseRoute.json();
  route.frontend.domains = [`${otoroshi.routeBaseDomain}${pathToProtect}`];
  route.backend.targets[0].hostname = hostname;
  route.backend.root = `/${path.join('/')}`;
  route.plugins.push(wafPlugin);

  await createRoute(otoroshi, route).then(sendToOtoroshi);

  Logger.println(`${colors.green('✔')} WAF enabled successfully`);
  Logger.println(`  └─ URL: ${colors.blue(`http://${otoroshi.routeBaseDomain}${pathToProtect}`)}`);
}
