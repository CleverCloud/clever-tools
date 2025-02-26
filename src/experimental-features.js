export const EXPERIMENTAL_FEATURES = {
  ai: {
    status: 'alpha',
    description: 'Manage Clever AI Chat services',
    instructions: `
- Create a Clever AI Chat service with Web UI enabled:
    clever ai create myChatService --conf ./path/to/config.json
- Access the Web UI:
    clever ai webui open myChatService
- Get cURL instructions:
    clever ai get curl-instructions myChatService
- List Clever AI Chat services:
    clever ai list
- List supported providers:
    clever ai providers list

Learn more about Clever AI Chat services: https://developers.clever-cloud.com/doc/addons/ai-chat/
`,
  },
  kv: {
    status: 'alpha',
    description: 'Send commands to databases such as Materia KV or Redis® directly from Clever Tools, without other dependencies',
    instructions: `
Target any compatible add-on by its name or ID (with an org ID if needed) and send commands to it:

    clever kv myMateriaKV SET myKey myValue
    clever kv kv_xxxxxxxx GET myKey -F json
    clever kv addon_xxxxx SET myTempKey myTempValue EX 120
    clever kv myMateriaKV -o myOrg TTL myTempKey
    clever kv redis_xxxxx --org org_xxxxx PING

Learn more about Materia KV: https://www.clever-cloud.com/developers/doc/addons/materia-kv/`,
  },
  ng: {
    status: 'beta',
    description: 'Manage Network Groups to manage applications, add-ons, external peers through a Wireguard network',
    instructions: `
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
Learn more about Network Groups: https://github.com/CleverCloud/clever-tools/blob/davlgd-new-ng/docs/ng.md`,
  },
};
