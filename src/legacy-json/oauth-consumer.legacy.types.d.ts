/**
 * An OAuth consumer as the API returns it (`OAuth1ConsumerView`), which is what the
 * `clever oauth-consumers` commands printed with `--format json` before the
 * `@clevercloud/client` migration.
 */
export interface LegacyOauthConsumer {
  name: string;
  description: string;
  key: string;
  url: string;
  picture: string;
  baseUrl: string;
  rights: LegacyOauthConsumerRights;
}

/** The rights of an OAuth consumer, named as the API names them. */
export interface LegacyOauthConsumerRights {
  almighty: boolean;
  access_organisations: boolean;
  access_organisations_bills: boolean;
  access_organisations_credit_count: boolean;
  access_organisations_consumption_statistics: boolean;
  access_personal_information: boolean;
  manage_organisations: boolean;
  manage_organisations_services: boolean;
  manage_organisations_applications: boolean;
  manage_organisations_members: boolean;
  manage_personal_information: boolean;
  manage_ssh_keys: boolean;
}
