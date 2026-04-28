import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import dedent from 'dedent';
import slugify from 'slugify';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { resolveId } from '../../models/application.js';
import { getOrgaIdOrUserId } from '../../models/notification.js';
import { sendToApi } from '../../models/send-to-api.js';
import { tag } from '../../parsers.js';
import { appIdOrNameOption, orgaIdOrNameOption } from '../global.options.js';
import { defineOption } from '../../lib/define-option.js';

// TODO: get supported addons/app from some Hashicorp registry api
const SUPPORTED_ADDONS = ['addon', 'cellar', 'keycloak', 'materia_kv', 'metabase', 'mongodb', 'postgresql', 'redis'];
const SUPPORTED_APPS = ['docker', 'go', 'java_war', 'nodejs', 'php', 'python', 'scala', 'static'];

const tagOption = defineOption({
  name: 'tag',
  schema: z.string().transform(tag).optional(),
  description: 'Filter resources by tag',
  aliases: ['t'],
  placeholder: 'tag',
});

export const terraformGenerateCommand = defineCommand({
  description: 'Generate terraform import file',
  since: '14.0.0',
  options: {
    org: orgaIdOrNameOption,
    app: appIdOrNameOption,
    tag: tagOption,
  },
  args: [],
  async handler(options) {
    const { org, app, tag: tagFilter } = options;
    const ownerId = await getOrgaIdOrUserId(org);
    const summary = await getSummary({ id: ownerId }).then(sendToApi);
    const orga = summary.organisations.find((orga) => orga.id === ownerId);
    if (!orga) {
      throw new Error(`Could not find organisation with ID: ${ownerId}`);
    }

    let applications = orga.applications;
    let addons = orga.addons;

    if (app) {
      const { appId } = await resolveId(app, null);
      applications = applications.filter((app) => app.id === appId);
      addons = [];
    }

    const appToImport = prepareApps(applications, tagFilter);
    const addonToImport = prepareAddons(addons, tagFilter);
    const out = appToImport
      .concat(addonToImport)
      .map((app) => {
        return {
          ...app,
          name: slugify(app.name, { lower: true, strict: true, trim: true }),
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

    Logger.println(out);
  },
});

function prepareApps(applications, tag = null) {
  return applications
    .map((app) => {
      let instanceType = app.instanceType;
      if (instanceType === 'node') {
        instanceType = 'nodejs';
      }
      if (instanceType === 'java' && app.variantSlug === 'sbt') {
        instanceType = 'scala';
      }

      return {
        resourceKind: instanceType,
        id: app.id,
        name: app.name || app.id,
        tags: app.systemTags.concat(app.customerTags),
      };
    })
    .filter((app) => {
      const supported = SUPPORTED_APPS.includes(app.resourceKind);
      if (!supported) {
        Logger.printErrorLine(`Skipping unsupported app: ${app.resourceKind}/${app.name}`);
        return false;
      }

      if (tag && !app.tags.includes(tag)) {
        return false;
      }

      return true;
    });
}

function prepareAddons(addons, tag = null) {
  return addons
    .map((addon) => {
      let providerId = addon.providerId;
      if (providerId === 'kv') {
        providerId = 'materia_kv';
      }

      let id = addon.realId;
      if (addon.resourceKind === 'mongodb') {
        id = addon.id;
      }

      return {
        resourceKind: providerId.replaceAll('-addon', '').replaceAll('addon-', ''),
        id,
        name: addon.name || addon.realId,
        tags: addon.systemTags.concat(addon.customerTags),
      };
    })
    .filter((addon) => {
      if (addon.name.startsWith('[SYSTEM]')) {
        return false;
      }

      const supported = SUPPORTED_ADDONS.includes(addon.resourceKind);
      if (!supported) {
        Logger.printErrorLine(`Skipping unsupported addon: ${addon.resourceKind}/${addon.name}`);
        return false;
      }

      if (tag && !addon.tags.includes(tag)) {
        return false;
      }

      return true;
    });
}
