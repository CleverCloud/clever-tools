import { APP_PHP } from './application.ts';

/** Add-on as returned by `GET /v2/organisations/:ownerId/addons/:addonId`. */
export interface RawAddon {
  id: string;
  name: string;
  realId: string;
  region: string;
  zoneId: string;
  provider: {
    id: string;
    name: string;
    website: string;
    supportEmail: string;
    googlePlusName: string;
    twitterName: string;
    analyticsId: string;
    shortDesc: string;
    longDesc: string;
    logoUrl: string;
    status: string;
    openInNewTab: boolean;
    canUpgrade: boolean;
    regions: Array<string>;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    price_id: string;
    zones: Array<string>;
    features: Array<{
      name: string;
      type: string;
      value: string;
      computable_value: string | null;
      name_code: string | null;
    }>;
  };
  creationDate: number;
  configKeys: Array<string>;
  tags: Array<string>;
}

/** PostgreSQL add-on, its real ID differs from its add-on ID. */
export const ADDON_POSTGRESQL = {
  id: 'addon_00000000-0000-4000-8000-000000000600',
  name: 'my-postgresql-addon',
  realId: 'postgresql_00000000-0000-4000-8000-000000000600',
  region: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  provider: {
    id: 'postgresql-addon',
    name: 'PostgreSQL',
    website: 'http://www.clever-cloud.com',
    supportEmail: 'support@clever-cloud.com',
    googlePlusName: '',
    twitterName: '',
    analyticsId: '',
    shortDesc: 'A powerful, open source object-relational database system',
    longDesc: 'Wanna add an addon to your Clever Cloud account? Want it to be a postgresql database? This is for you!',
    logoUrl: 'https://assets.clever-cloud.com/logos/pgsql.svg',
    status: 'RELEASE',
    openInNewTab: false,
    canUpgrade: true,
    regions: ['grahds', 'ldn', 'mtl', 'par', 'parhds', 'rbx', 'rbxhds', 'scw', 'sgp', 'syd', 'wsw'],
  },
  plan: {
    id: 'plan_d2ada71a-aa8e-4ead-8cb9-28314664437e',
    name: 'DEV',
    slug: 'dev',
    price: 0,
    price_id: 'postgresql.dev',
    zones: ['par', 'mtl'],
    features: [
      {
        name: 'Max DB size',
        type: 'BYTES',
        value: '256 MB',
        computable_value: '268435456',
        name_code: 'disk-size',
      },
    ],
  },
  creationDate: 1767225600000,
  configKeys: [
    'POSTGRESQL_ADDON_DB',
    'POSTGRESQL_ADDON_HOST',
    'POSTGRESQL_ADDON_PASSWORD',
    'POSTGRESQL_ADDON_PORT',
    'POSTGRESQL_ADDON_URI',
    'POSTGRESQL_ADDON_USER',
    'POSTGRESQL_ADDON_VERSION',
  ],
  tags: [],
} satisfies RawAddon;

/**
 * FS bucket add-on created with an SFTP application (`APP_PHP`): it has no `addon_` ID, its add-on ID and its real ID
 * are both the ID of the application, the only entity sharing its UUID with another one.
 */
export const ADDON_FS_BUCKET_PHP = {
  id: APP_PHP.id,
  name: 'FS - my-php-app',
  realId: APP_PHP.id,
  region: 'par',
  zoneId: 'aad32a21-24f8-40b3-a750-baab218d927b',
  provider: {
    id: 'fs-bucket',
    name: 'FS Buckets',
    website: 'https://www.clever-cloud.com/',
    supportEmail: 'support@clever-cloud.com',
    googlePlusName: '',
    twitterName: '',
    analyticsId: '',
    shortDesc: 'Persistent file system for your application',
    longDesc: '',
    logoUrl: 'https://assets.clever-cloud.com/logos/fsbucket.svg',
    status: 'RELEASE',
    openInNewTab: false,
    canUpgrade: false,
    regions: ['ldn', 'mtl', 'par', 'rbx', 'scw', 'sgp', 'syd', 'wsw'],
  },
  plan: {
    id: 'plan_468e8bf6-11fc-46e0-aeaf-778b687b8bb3',
    name: 'PHP',
    slug: 'php',
    price: 0,
    price_id: 'fs-bucket.php',
    zones: ['ldn', 'syd', 'scw', 'sgp', 'wsw', 'par', 'rbx', 'mtl'],
    features: [
      { name: 'Mounts', type: 'NUMBER', value: 'Unlimited', computable_value: null, name_code: null },
      { name: 'Storage', type: 'NUMBER', value: 'Special for PHP+FTP', computable_value: null, name_code: 'storage' },
    ],
  },
  creationDate: 1767225600000,
  configKeys: ['APP_BUCKET_HOST'],
  tags: [],
} satisfies RawAddon;
