export const EXPERIMENTAL_FEATURES = {
  kv: {
    status: 'alpha',
    description: 'Send commands to Materia KV directly from Clever Tools, without other dependencies',
    instructions: `
To use Materia KV from Clever Tools, you need the 'KV_TOKEN' environment variable set.

Then you can directly send any supported command to Materia KV:

    clever kv ping
    clever kv set myKey myValue
    clever kv set myTempKey myTempValue ex 120
    clever kv get myKey
    clever kv ttl myTempKey

You can also use the 'clever kv getJson' command to query a value from key containing a JSON object:

    clever kv set simpleJson '{"key": "value"}'
    clever kv getJson simpleJson key
    clever kv set jsonKey '[{"key": "value"}, {"bigKey": {"subKey1": "subValue1","subKey2": "subValue2"}}]'
    clever kv getjson jsonKey bigKey.subKey2
    clever kv getjson jsonKey ''

Learn more about Materia KV: https://developers.clever-cloud.com/doc/addons/materia-kv/
`,
  },
  ng: {
    status: 'beta',
    description: 'Manage Network Groups to link applications, add-ons, external peers in a Wireguard® network',
    instructions: `
- Create a Network Group:
    clever ng create myNG
- Create a Network Group with members (application, add-on, external):
    clever ng create myNG --members-ids appId1,appId2
- Add an application to an existing Network Group:
    clever ng add-app myNG myApp
- List Network Groups:
    clever ng list
- List Network Groups members:
    clever ng members list myNG
- List Network Groups peers (instances of a member):
    clever ng peers list myNG
- Delete a Network Group:
    clever ng delete myNG

Learn more about Network Groups: https://github.com/CleverCloud/clever-tools/tree/master/docs/ng.md
`,
  },
};
