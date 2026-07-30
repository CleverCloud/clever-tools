/**
 * Inverse of `transformOauthConsumer` in
 * `@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer.types.js').OauthConsumer} oauthConsumer
 * @returns {import('./oauth-consumer.legacy.types.js').LegacyOauthConsumer}
 */
export function toLegacyOauthConsumer(oauthConsumer) {
  return {
    name: oauthConsumer.name,
    description: oauthConsumer.description,
    key: oauthConsumer.key,
    url: oauthConsumer.url,
    picture: oauthConsumer.picture,
    baseUrl: oauthConsumer.baseUrl,
    rights: toLegacyOauthConsumerRights(oauthConsumer.rights),
  };
}

/**
 * Inverse of `transformOauthConsumerRights` in
 * `@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer-transform.js`.
 *
 * @param {Record<import('@clevercloud/client/cc-api-commands/oauth-consumer/oauth-consumer.types.js').OauthConsumerRights, boolean>} rights
 * @returns {import('./oauth-consumer.legacy.types.js').LegacyOauthConsumerRights}
 */
export function toLegacyOauthConsumerRights(rights) {
  return {
    almighty: rights.almighty,
    access_organisations: rights.accessOrganisations,
    access_organisations_bills: rights.accessOrganisationsBills,
    access_organisations_credit_count: rights.accessOrganisationsCreditCount,
    access_organisations_consumption_statistics: rights.accessOrganisationsConsumptionStatistics,
    access_personal_information: rights.accessPersonalInformation,
    manage_organisations: rights.manageOrganisations,
    manage_organisations_services: rights.manageOrganisationsServices,
    manage_organisations_applications: rights.manageOrganisationsApplications,
    manage_organisations_members: rights.manageOrganisationsMembers,
    manage_personal_information: rights.managePersonalInformation,
    manage_ssh_keys: rights.manageSshKeys,
  };
}
