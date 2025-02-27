export const EXPERIMENTAL_FEATURES = {
  kms: {
    status: 'alpha',
    description: 'Manage your secrets in Clever KMS',
    instructions: `
GET and PUT secret in Clever KMS directly from Clever Tools, without other dependencies

  clever kms put mySecret mySecretKey=mySecretValue
  clever kms put myOtherSecret mySecretKey=mySecretValue myOtherSecretKey="$MY_ENV_VAR_SECRET_VALUE"
  clever kms get mySecret
  clever kms get myOtherSecret -F json

Learn more about Materia KV: https://www.clever-cloud.com/developers/doc/addons/kms
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

      Learn more about Materia KV: https://www.clever-cloud.com/developers/doc/addons/materia-kv/
      `,
  },
};
