import dedent from 'dedent';
import { conf } from './models/configuration.js';

export const EXPERIMENTAL_FEATURES = {
  kv: {
    status: 'alpha',
    description: 'Send commands to databases such as Materia KV or Redis® directly from Clever Tools, without other dependencies',
    instructions: dedent`
      Target any compatible add-on by its name or ID (with an org ID if needed) and send commands to it:

          clever kv myMateriaKV SET myKey myValue
          clever kv kv_xxxxxxxx GET myKey -F json
          clever kv addon_xxxxx SET myTempKey myTempValue EX 120
          clever kv myMateriaKV -o myOrg TTL myTempKey
          clever kv redis_xxxxx --org org_xxxxx PING

      Learn more about Materia KV: ${conf.DOC_URL}/addons/materia-kv/
    `,
  },
  ng: {
    status: 'beta',
    description: 'Manage Network Groups to manage applications, add-ons, external peers through a Wireguard network',
    instructions: dedent`
      - Create a Network Group:
          clever ng create myNG
      - Create a Network Group with members (application, database add-on):
          clever ng create myNG --link app_xxx,addon_xxx
      - List Network Groups:
          clever ng
      - Delete a Network Group:
          clever ng delete myNG
      - (Un)Link an application or a database add-on to an existing Network Group:
          clever ng link app_xxx myNG
          clever ng unlink addon_xxx myNG
      - Get the Wireguard configuration of a peer:
          clever ng get-config peerIdOrLabel myNG
      - Get details about a Network Group, a member or a peer:
          clever ng get myNg
          clever ng get app_xxx
          clever ng get peerId
          clever ng get memberLabel
      - Search Network Groups, members or peers:
          clever ng search myQuery

      Learn more about Network Groups: ${conf.DOC_URL}/develop/network-groups/
    `,
  },
  operators: {
    status: 'beta',
    description: 'Manage operators and their features such as Keycloak, Matomo, Metabase, Otoroshi',
    instructions: dedent`
      clever keycloak
      clever keycloak get keycloak_xxx
      clever keycloak ng enable myKeycloak

      clever metabase version check myMetabase
      clever metabase version update myMetabase 0.53

      clever matomo open myMatomo
      clever otoroshi open logs myOtoroshi
    `,
  },
};
