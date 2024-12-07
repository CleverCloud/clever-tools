export const EXPERIMENTAL_FEATURES = {
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
