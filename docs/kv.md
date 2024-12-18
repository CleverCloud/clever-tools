# Clever KV

If you're using [Materia KV](https://www.clever-cloud.com/developers/doc/addons/materia-kv/), our next generation of key-value databases, serverless, distributed, synchronously-replicated, compatible with the Redis® protocol (and later DynamoDB, GraphQL), you can easily create an add-on with Clever Tools:

```
clever addon create kv ADDON_NAME
```

And immediately use it with `clever kv` command:

```bash
clever kv ADDON_NAME_OR_ID PING          # It will answer PONG
clever kv ADDON_NAME_OR_ID PING Hello    # It will answer Hello
```

It helps you to inspect and interact with your Materia KV. Each is provided with environment variables about its host, port, and [Biscuit-based](https://biscuitsec.org) tokens, in multiple forms (to ensure compatibility with tools such those made for Redis®).

[!Tip]
> Clever KV command is also compatible with Redis® on Clever Cloud add-ons.

## Commands

You can use `clever kv` to send any command supported by your add-on. Here are some examples:

```bash
clever kv ADDON_NAME_OR_ID INCR myCounter             # It will respond (integer) the incremented value
clever kv ADDON_NAME_OR_ID SET myKey myValue          # It will respond OK
clever kv ADDON_NAME_OR_ID GET myKey                  # It will respond myValue
clever kv ADDON_NAME_OR_ID SET myKey myValue EX 120   # It will respond OK
clever kv ADDON_NAME_OR_ID TTL myKey                  # It will respond (integer) the remaining time to live of the key in seconds
```

>[!Tip]
>You can get a list of all supported commands with `clever kv ADDON_NAME_OR_ID COMMANDS`

You can pass the result of JSON stringified values to tools like `jq` to query them, for example:

```bash
clever kv ADDON_NAME_OR_ID SET myJsonFormatedKey '{"key": "value"}'
clever kv ADDON_NAME_OR_ID GET myJsonFormatedKey | jq .key
```

You can also use the `-F/--format` option to print a result in JSON format and query it with `jq`:

```bash
clever kv ADDON_NAME_OR_ID scan 0 -F json | jq '.[1][0]'
```
