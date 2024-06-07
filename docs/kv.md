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

clever kv PING # It will answer PONG
```

It helps you to inspect and interact with your Materia KV add-ons. Each is provided with environment variables about its host, port, and Biscuit-based tokens, in multiple forms (to ensure compatibility with tools such those made for Redis).

`clever kv` only needs `KV_TOKEN` environment variable to be set. Alternatively, you can target a specific add-on with the following options:

```
[--org, -o, --owner]       Organisation ID (or name, if unambiguous)
[--addon-id]               Add-on ID (or name, if unambiguous)
```

## Commands

As `clever kv` is still at a proof of concept stage, for demonstration purposes, we only support some commands from the Redis protocol:

```
ping                       Check if the Materia KV cluster responds
get                        Get Materia KV value from its key
set                        Set a Materia KV key with a value
append                     Append a value to a Materia KV key
incr                       Increment a Materia KV key
decr                       Decrement a Materia KV key
del                        Delete a Materia KV key
flushdb                    Delete all Materia KV keys
ping                       Check if the Materia KV cluster responds
exists                     Check if a Materia KV key exists
strlen                     Get the length of a Materia KV key
type                       Get the type of a Materia KV key
keys                       List all Materia KV keys, filtered by a pattern (can be '*')
scan                       List all Materia KV keys
dbsize                     Get the number of keys in the Materia KV
```

>[!Tip]
>You can get a list of all the Materia KV supported commands with `clever kv commands`

## Raw commands

If a command is supported by Materia KV and not by `clever kv`, you can use the `redis_raw` command:

```bash
clever kv redis_raw 'hset key field1 value1 field2 value2 field3 value3'    # It will respond 3
clever kv redis_raw 'hget key field2'                                       # It will respond value2
clever kv redis_raw 'hgetall key'                                           # It will respond with the full hash
```

## JSON support

If you want to use JSON with Materia KV from Clever Tools, you can use the `getjson` command:

```bash
clever kv set simpleJson '{"key": "value"}'                                 # It will respond the set data
clever kv getJson simpleJson key                                            # It will respond value
clever kv set jsonKey '[{"key": "value"}, {"bigKey": {"subKey1": "subValue1","subKey2": "subValue2"}}]'
clever kv getjson jsonKey bigKey.subKey2                                    # It will respond subValue1
clever kv getjson jsonKey ''                                                # It will respond the full JSON
```
