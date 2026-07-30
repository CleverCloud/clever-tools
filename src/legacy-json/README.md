# `src/legacy-json` — keeping `--format json` stable across the client migration

`--format json` is a machine-readable contract: scripts and CI jobs parse it. The migration from
`sendToApi` to `@clevercloud/client` changed the payloads every command receives, because the client
normalizes what the API returns — keys are renamed, dates become ISO strings, null fields are
dropped. Printing those results directly would silently change that contract.

This directory holds the transforms that put the payloads back into the shape the CLI printed before
the migration. They are deliberately temporary: the new shapes are better, and a future major release
will adopt them, delete this directory and document the change. Until then, the rule is that the
client shapes power everything (human rendering, internal logic, types) and only the JSON branch of a
command converts back.

## Conventions

**One module per client transform.** Each file here is the inverse of exactly one `*-transform.js`
in `@clevercloud/client`, and carries the same basename: `api-token.legacy.js` inverts
`cc-api-bridge-commands/api-token/api-token-transform.js`. Reviewing a mapper is then a matter of
reading the two files side by side, and a client changelog entry naming a transform points at the one
file to re-check.

**One function per shape**, named `toLegacy<Type>`, taking a single item and returning a single item.
Callers `.map()` over lists. The only exception is a legacy shape that is itself a container, where
the grouping is part of what has to be restored.

**Both ends are typed.** The parameter is the client type, so a rename in a future client version
becomes a type error here instead of a silent JSON regression. The return type is a `Legacy*`
interface declared in the sibling `*.legacy.types.d.ts`, reconstructed from what the CLI printed
before the migration and frozen: nothing in this directory should ever gain a field.

**Convert at the command, never in a model.** Models return client shapes. The conversion belongs in
the `case 'json'` branch, so the human branch of the same command keeps reading the good shape:

```js
case 'json': {
  Logger.printJson(tokens.map(toLegacyApiToken));
  break;
}
```

**Say what cannot be restored.** Some of what the client drops never reaches the CLI: precision lost
when a date is normalized, fields a transform does not copy, payloads a stream filters out. A mapper
that cannot rebuild a field documents it in a comment rather than guessing, and the delta goes in the
changelog.

## Adding one

1. Read the client transform and the wire payload it consumes.
2. Check what the command printed on `master` — the file's history is the reference, not the wire
   shape alone, since some commands built their own literal on top of the payload.
3. Write the mapper and its `Legacy*` type, then pin the output with a test in the command's
   `*.command.test.ts`: mock the wire body, run `--format json`, assert the parsed stdout.

## What stays different, and belongs in the changelog

- **Dates** are kept as the ISO strings the client normalizes them to. `normalizeDate` accepts epoch
  milliseconds, `Date` objects and `…Z[UTC]` strings alike, so whichever form the API sent is gone by
  the time the CLI sees the value. It affects `k8s` and `drain`; `addon list` is the exception, since
  its date was epoch milliseconds and epoch milliseconds is what it is converted back to.
- **`database backups`** loses the microseconds of `creationDate`: `normalizeDate` truncates them to
  milliseconds, and nothing downstream can bring them back.
- **`accesslogs`** no longer emits the access logs of TCP redirections and SSH sessions at all: the
  client's transform answers `undefined` for anything that is not HTTP, and the stream skips those.
- **Otoroshi environment variables** are dropped by the client, which does not carry them in
  `OtoroshiInfo` at all, where the other three operators keep theirs.
- **Network group member `kind`** is uppercased before the CLI sees it, and the API's original case
  is not recorded anywhere.
- **Environment variable order** follows the client's sort by name, where the API answered with an
  object whose key order the CLI never saw.

Restoring any of these means fixing the transform in `clever-client.js`, not adding code here.
