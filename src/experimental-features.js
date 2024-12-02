export const EXPERIMENTAL_FEATURES = {
  kv: {
    status: 'alpha',
    description: 'Send commands to databases such as Materia KV or Redis® directly from Clever Tools, without other dependencies',
    instructions: `
      Target any compatible add-on by its name or ID (with an org ID if needed) and send commands to it:

          clever kv myMateriaKV set myKey myValue
          clever kv kv_xxxxxxxx get myKey -F json
          clever kv addon_xxxxx set myTempKey myTempValue ex 120
          clever kv myMateriaKV -o myOrg ttl myTempKey
          clever kv redis_xxxxx --org org_xxxxx ping

      Learn more about Materia KV: https://developers.clever-cloud.com/doc/addons/materia-kv/
      `,
  },
};
