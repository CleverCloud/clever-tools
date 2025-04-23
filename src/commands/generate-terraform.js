import { getOrgaIdOrUserId } from '../models/notification.js';
import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import * as Application from '../models/application.js';
import { sendToApi } from '../models/send-to-api.js';
import dedent from 'dedent';
import { Logger } from '../logger.js';
import slugify from 'slugify';

// TODO: get supported addons/app from some Hashicorp registry api
const SUPPORTED_ADDONS = ['addon', 'cellar', 'keycloak', 'materia_kv', 'metabase', 'mongodb', 'postgresql', 'redis'];
const SUPPORTED_APPS = ['docker', 'go', 'java_war', 'nodejs', 'php', 'python', 'scala', 'static'];

export async function generateTerraform (params) {
  const { org, app } = params.options;
  const ownerId = await getOrgaIdOrUserId(org);
  const summary = await getSummary({ id: ownerId }).then(sendToApi);
  const orga = summary.organisations.find((orga) => orga.id === ownerId);
  if (!orga) {
    throw new Error(`Could not find organisation with ID: ${ownerId}`);
  }
  //console.log(JSON.stringify(orga.applications, null, 2)); process.exit(0);

  let applications = orga.applications;
  let addons = orga.addons;

  if (app) {
    const { appId } = await Application.resolveId(app, null);
    applications = applications.filter((app) => app.id === appId);
    addons = [];
  }

  const appToImport = applications
    .map((app) => {
      let instanceType = app.instanceType;
      if (instanceType === 'nodejs') {
        instanceType = 'nodejs';
      }

      return { resourceKind: instanceType, id: app.id, name: app.name || app.id };
    })
    .filter((app) => {
      const supported = SUPPORTED_APPS.includes(app.resourceKind);
      if (!supported) {
        Logger.printErrorLine(`Skipping unsupported app: ${app.resourceKind}/${app.name}`);
      }
      return supported;
    });

  const addonToImport = addons
    .map((addon) => {

      let providerId = addon.providerId;
      if (providerId === 'kv') {
        providerId = 'materia_kv';
      }

      return {
        resourceKind: providerId.replaceAll('-addon', '').replaceAll('addon-', ''),
        id: addon.realId,
        name: addon.name || addon.realId,
      };
    })
    .filter((addon) => {
      if (addon.name.startsWith('[SYSTEM]')) {
        return false;
      }

      const supported = SUPPORTED_ADDONS.includes(addon.resourceKind);
      if (!supported) {
        Logger.printErrorLine(`Skipping unsupported addon: ${addon.resourceKind}/${addon.name}`);
      }
      return supported;
    });

  // console.log(appToImport);
  // console.log(addonToImport);

  const out = appToImport
    .concat(addonToImport).map((app) => {
      return {
        ...app,
        name: app.name
          .replaceAll('.', '_')
          .replaceAll(' ', '_')
          .replaceAll('(', '')
          .replaceAll(')', '')
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll('/', '_')
          .replaceAll(';', ''),
      };
    })
    .filter(({ name }) => {
      if (name.match(/^\d.*/)) {
        Logger.printErrorLine(`Skipping ${name}: name cannot starts with number`);
        return false;
      }
      return true;
    })
    .map(({ name, resourceKind, id }) => {
      return dedent`# ${name}
    import {
      to = clevercloud_${resourceKind}.${name}
      id = "${id}"
    }`;
    })
    .join('\n\n');

  console.log(out);
}
