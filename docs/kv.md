# Clever Cloud Materia KV

If you're testing [Materia KV](https://developers.clever-cloud.com/doc/addons/materia-kv/), our next generation of key-value databases, serverless, distributed, synchronously-replicated, compatible with the Redis protocol (and later DynamoDB, GraphQL), you can easily create an add-on with Clever Tools:

```
clever addon create kv ADDON_NAME
```

And immediately use it after sourcing its environment variables with `clever kv` command:

```bash
# With Bash and Zsh
source <(clever addon env ADDON_ID --export)
# With Fish
clever addon env ADDON_ID --export | source

clever kv PING          # It will answer PONG
clever kv PING Hello    # It will answer Hello
```

It helps you to inspect and interact with your Materia KV add-ons. Each is provided with environment variables about its host, port, and [Biscuit-based](https://biscuitsec.org) tokens, in multiple forms (to ensure compatibility with tools such those made for Redis).

`clever kv` only needs `KV_TOKEN` environment variable to be set. Alternatively, you can target a specific add-on with the following options:

```
[--org, -o, --owner]       Organisation ID (or name, if unambiguous)
[--addon-id]               Add-on ID (or name, if unambiguous)
```

## Commands

As `clever kv` is still at a proof of concept stage, for demonstration purposes, we only support some commands from the Redis protocol.

>[!Tip]
>You can get a list of all the Materia KV supported commands with `clever kv commands`


Here are some examples:

```bash
clever kv hset key field1 value1 field2 value2 field3 value3    # It will respond 3
clever kv hget key field2                                       # It will respond value2
clever kv hgetall key                                           # It will respond with the full hash
```

## JSON support

For now, if you want to use JSON with Materia KV from Clever Tools, you can use the `getjson` command:

```bash
clever kv set simpleJson '{"key": "value"}'                                 # It will respond the set data
clever kv getjson simpleJson key                                            # It will respond value
clever kv set jsonKey '[{"key": "value"}, {"bigKey": {"subKey1": "subValue1","subKey2": "subValue2"}}]'
clever kv getjson jsonKey bigKey.subKey2                                    # It will respond subValue2
clever kv getjson jsonKey ''                                                # It will respond the full JSON
```
