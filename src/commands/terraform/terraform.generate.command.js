import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import dedent from 'dedent';
import slugify from 'slugify';
import { z } from 'zod';
import { getOperator, getProviderAddon } from '../../clever-client/operators.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { resolveId } from '../../models/application.js';
import { getOwnerIdFromOrgIdOrName } from '../../models/ids-resolver.js';
import { sendToApi } from '../../models/send-to-api.js';
import { tag } from '../../parsers.js';
import { appIdOrNameOption, orgaIdOrNameOption } from '../global.options.js';

/**
 * Terraform resource name for each application variant.
 * The provider pins a variant slug per resource (`GetVariantSlug()`), so the
 * variant is the only reliable discriminator: `instanceType` is `magic` for
 * every recent runtime and `java` for jar, war, play2 and sbt alike.
 */
const APP_RESOURCE_BY_VARIANT = {
  docker: 'docker',
  dotnet: 'dotnet',
  frankenphp: 'frankenphp',
  go: 'go',
  haskell: 'haskell',
  jar: 'java_jar',
  linux: 'linux',
  node: 'nodejs',
  php: 'php',
  play2: 'play2',
  python: 'python',
  ruby: 'ruby',
  rust: 'rust',
  sbt: 'scala',
  static: 'static',
  'static-apache': 'static_apache',
  v: 'v',
  war: 'java_war',
};

/** Terraform resource name for each add-on provider. */
const ADDON_RESOURCE_BY_PROVIDER = {
  'addon-matomo': 'matomo',
  'addon-pulsar': 'pulsar',
  'cellar-addon': 'cellar',
  'config-provider': 'configprovider',
  'es-addon': 'elasticsearch',
  'fs-bucket': 'fsbucket',
  keycloak: 'keycloak',
  kv: 'materia_kv',
  metabase: 'metabase',
  'mongodb-addon': 'mongodb',
  'mysql-addon': 'mysql',
  otoroshi: 'otoroshi',
  'postgresql-addon': 'postgresql',
  'redis-addon': 'redis',
};

/**
 * Add-on providers without a dedicated Terraform resource fall back to this one,
 * which drives any marketplace add-on through the add-on provider API. It is the
 * only add-on resource keyed on the add-on ID rather than the real ID: that is
 * what its `Create` writes to the state, and its `Read` does not normalize.
 */
const GENERIC_ADDON_RESOURCE = 'addon';

/**
 * Add-on providers that provision resources of their own, and where to ask each one
 * what it manages:
 * - `operator`: `GET /v4/addon-providers/addon-{kind}/addons/{realId}` answers with a
 *   `resources` object whose values are the IDs, under keys that vary by provider
 * - `provider`: `GET /v2/providers/{providerId}/{addonId}` answers with one field per
 *   side application, such as `kibana_application` on an Elasticsearch
 */
const MANAGED_RESOURCE_SOURCES = {
  'addon-matomo': 'operator',
  keycloak: 'operator',
  metabase: 'operator',
  otoroshi: 'operator',
  'es-addon': 'provider',
};

const tagOption = defineOption({
  name: 'tag',
  schema: z.string().transform(tag).optional(),
  description: 'Filter resources by tag',
  aliases: ['t'],
  placeholder: 'tag',
});

export const terraformGenerateCommand = defineCommand({
  description: 'Generate terraform import file',
  since: '5.1.0',
  options: {
    org: orgaIdOrNameOption,
    app: appIdOrNameOption,
    tag: tagOption,
  },
  args: [],
  async handler(options) {
    const { org, app, tag: tagFilter } = options;
    const ownerId = await getOwnerIdFromOrgIdOrName(org);
    const summary = await getSummary({}).then(sendToApi);
    const owner = [summary.user, ...summary.organisations].find((owner) => owner.id === ownerId);
    if (!owner) {
      throw new Error(`Could not find owner with ID: ${ownerId}`);
    }

    let applications = owner.applications;
    let addons = owner.addons;

    if (app) {
      const { appId } = await resolveId(app, null);
      applications = applications.filter((app) => app.id === appId);
      addons = [];
    }

    const managedIds = await listManagedResourceIds(owner.addons);
    const resources = prepareApps(applications, managedIds, tagFilter).concat(
      prepareAddons(addons, managedIds, tagFilter),
    );

    const out = assignResourceNames(resources)
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

/**
 * List the resources provisioned by the add-ons of an owner.
 * Keycloak, Matomo, Metabase and Otoroshi each run on their own application and
 * add-ons, and an Elasticsearch carries a Kibana application. All of them show up in
 * the summary as ordinary resources, so Terraform would happily take ownership of
 * them. Asking their provider is the only reliable way to tell them apart.
 * A provider that cannot be reached is reported and left unfiltered: an export that
 * is too wide and says so beats one that is silently wrong.
 * @param {Array<object>} addons Every add-on of the owner, unfiltered
 * @returns {Promise<Set<string>>}
 */
async function listManagedResourceIds(addons) {
  const parents = addons.filter((addon) => MANAGED_RESOURCE_SOURCES[addon.providerId] != null);

  const managedIds = await Promise.all(
    parents.map(async (parent) => {
      try {
        if (MANAGED_RESOURCE_SOURCES[parent.providerId] === 'operator') {
          const provider = ADDON_RESOURCE_BY_PROVIDER[parent.providerId];
          const details = await getOperator({ provider, realId: parent.realId }).then(sendToApi);
          return Object.values(details.resources ?? {});
        }

        const details = await getProviderAddon({ provider: parent.providerId, addonId: parent.id }).then(sendToApi);
        return Object.entries(details)
          .filter(([field]) => field.endsWith('_application'))
          .map(([, id]) => id);
      } catch (error) {
        Logger.printErrorLine(`Could not list the resources managed by ${parent.name}: ${error.message}`);
        return [];
      }
    }),
  );

  return new Set(managedIds.flat().filter((id) => typeof id === 'string'));
}

/**
 * Turn resource names into unique, valid Terraform identifiers.
 * Terraform identifiers cannot start with a digit, and two resources of the
 * same kind cannot share a name: both happen with real-world naming.
 * @param {Array<object>} resources
 * @returns {Array<object>}
 */
function assignResourceNames(resources) {
  const used = new Set();

  return resources.map((resource) => {
    let name = slugify(resource.name, { lower: true, strict: true, trim: true });

    if (name === '') {
      name = resource.id;
    }
    if (name.match(/^\d/)) {
      name = `_${name}`;
    }

    const key = `${resource.resourceKind}.${name}`;
    if (used.has(key)) {
      const discriminator = resource.id.split('_')[1].slice(0, 8);
      Logger.printErrorLine(`Name collision on ${key}: suffixing with ${discriminator}`);
      name = `${name}-${discriminator}`;
    }
    used.add(`${resource.resourceKind}.${name}`);

    return { ...resource, name };
  });
}

function prepareApps(applications, managedIds, tag = null) {
  return applications
    .map((app) => {
      return {
        resourceKind: APP_RESOURCE_BY_VARIANT[app.variantSlug],
        variant: app.variantSlug,
        id: app.id,
        name: app.name || app.id,
        tags: app.systemTags.concat(app.customerTags),
      };
    })
    .filter((app) => {
      if (managedIds.has(app.id)) {
        Logger.printErrorLine(`Skipping add-on managed app: ${app.variant}/${app.name}`);
        return false;
      }

      if (app.resourceKind == null) {
        Logger.printErrorLine(`Skipping unsupported app: ${app.variant}/${app.name}`);
        return false;
      }

      if (tag && !app.tags.includes(tag)) {
        return false;
      }

      return true;
    });
}

function prepareAddons(addons, managedIds, tag = null) {
  return addons
    .map((addon) => {
      const resourceKind = ADDON_RESOURCE_BY_PROVIDER[addon.providerId] ?? GENERIC_ADDON_RESOURCE;

      return {
        resourceKind,
        provider: addon.providerId,
        // Dedicated resources store the real ID in the state, the generic one stores
        // the add-on ID: both match what the matching `Create` writes
        id: resourceKind === GENERIC_ADDON_RESOURCE ? addon.id : addon.realId,
        realId: addon.realId,
        name: addon.name || addon.realId,
        tags: addon.systemTags.concat(addon.customerTags),
      };
    })
    .filter((addon) => {
      if (managedIds.has(addon.realId)) {
        Logger.printErrorLine(`Skipping add-on managed add-on: ${addon.provider}/${addon.name}`);
        return false;
      }

      if (addon.resourceKind === GENERIC_ADDON_RESOURCE) {
        Logger.printErrorLine(`Using generic clevercloud_addon for ${addon.provider}/${addon.name}`);
      }

      if (tag && !addon.tags.includes(tag)) {
        return false;
      }

      return true;
    });
}
