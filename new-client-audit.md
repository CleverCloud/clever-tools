# `refactor/new-client` — audit and remaining work

Audit of the `sendToApi` → `ccApiClient` migration on branch `refactor/new-client`, taken after the
rebase onto `origin/master` and after a fresh local build of `@clevercloud/client` (packed from
`../clever-client.js` at `1a799da`).

**Scope.** Every `@clevercloud/client` call site — 157 `new *Command(…)` constructions across 80
files — checked against the installed client: input shape, result shape, `getIdsToResolve()`
requirements, error handling, and behaviour compared against `master`.

**How the checks were run**, so they can be repeated:

- Command inventory: extract `getIdsToResolve()` from every `*-command.js` under
  `node_modules/@clevercloud/client/dist/src/clients`, then cross-reference against every
  `new XxxCommand({…})` in `src/`. This is what proves no call site relies on the client's built-in
  `ResourceIdResolver`.
- Type sweep: `tsconfig.json` only typechecks a narrow `include`, so almost nothing in `src/commands`
  and `src/models` is covered. Write a temporary `tsconfig.wide.json` extending it with
  `include: ["src/**/*.js", "src/**/*.ts", "scripts", "test"]` and run `tsc` against it. The output is
  ~1200 errors of JSDoc noise; only the delta between two runs is meaningful. Never pipe it through
  `tail` — the truncated output reads like a clean report.
- Smoke test: `node bin/clever.js --help`.

**Current counts.** Wide typecheck: 1223 errors, against a 1203 baseline taken before the rebase. All
20 new errors come from the rebase-seam files listed under P1 below and from items 1 and 2 (both since
fixed); the client build itself introduced none. Item 2's fix leaves the count unchanged — the
`Cannot find name 'body'` error becomes one more `sourceToken does not exist on { type, url }`, the
same JSDoc noise its five sibling branches already produce.

---

## P0 — blockers

None left. Items 1 and 2 are under [Done](#done).

---

## P1 — regressions

None left. Item 5 is under [P2](#5-isfavourite-now-means-primary-and-unset-has-no-visible-effect).

---

## P2 — robustness

### 5. `isFavourite` now means "primary", and `unset` has no visible effect

`src/models/domain.js:5` calls `GetPrimaryDomainCommand`, a composite over `ListDomainCommand`. That
command *guesses* a primary domain when the application has none set explicitly ("the result always
flags a primary domain as long as the application has at least one domain"), where master's
`getFavouriteDomain` returned `null` on API error 4021.

The guess itself is an improvement and should stay. It is what `clever open` and the post-deploy link
already did through master's `getBest`, so the three now agree, and it replaces an output that was
plainly broken: master's `clever domain favourite --format json` on an application with no favourite
called `getDomainObject(null, null)` and printed
`{"domainWithPathPrefix":null,"domain":null,…,"isFavourite":true}` — every field null, and
`isFavourite` already true because `null === null`.

What the guess does break is the vocabulary. `isFavourite` is emitted by `clever domain` and
`clever domain favourite` for a domain nobody set, so it no longer answers the question it is named
after; the client calls the same flag `isPrimary`, which is what it is. Concretely:

- `clever domain favourite unset` succeeds, then `clever domain favourite` still names a domain and
  `clever domain` still marks one with `*` — the command looks like it did nothing;
- the `'No favourite domain set'` branch in `domain.favourite.command.js:28` is unreachable for any
  application that has domains.

Renaming the field to `isPrimary` fixes the JSON contract. Making `unset` observable needs the
explicitly-set favourite, which `GetPrimaryDomainCommand`'s result cannot express — either a
dedicated client command or a comparison against the raw favourite endpoint.

### 6. `formatDrain` assumes `backlog` is present

`src/models/drain.js:76-78` reads `backlog.msgRateOut`, `backlog.msgThroughputOut` and
`backlog.msgBacklog` unconditionally. The client declares `backlog?` optional — "Absent when the drain
has no stats yet" — so `clever drain` and `clever drain get` throw on a freshly created drain. The
`Record<string, any>` cast on `:64` is what hides this from `tsc`. Master had the same assumption, so
this is not a migration regression, but the client now documents the field as optional.

### 9. `clever domain overview` doubles its request count

`src/commands/domain/domain.overview.command.js:81` fires one `ListDomainCommand` per application
through `Promise.all` with no concurrency cap. `ListDomainCommand` is a composite issuing two HTTP
requests (`/vhosts` + `/vhosts/favourite`), so this is 2N concurrent requests where master did N.
Worth a concurrency bound on large organisations, if only to stay clear of rate limiting.

---

## P3 — cleanup and simplification

- **Double `/v2/summary` fetch.** `src/models/ids-resolver.js:170-176` — `resolveOwnerId(keyOrName)`
  misses the cache, fetches the summary, returns `null`, and then `:176` fetches the very same summary
  again. The client has no request cache (`cache: null` by default). More broadly,
  `GetOrganisationSummariesCommand` is sent from six modules with no per-process memoization.
- **Return shape mismatch.** `src/models/ids-resolver.js:173` — the cache fast path returns
  `{ ownerId, key }` without `name`, contradicting the declared
  `Promise<Array<{ ownerId, key, name }>>`. `resolveOauthConsumer`'s ambiguity message reads `c.name`;
  it is unreachable today because the fast path returns a single element, but the shapes should match.
- **JSDoc arity rot.** `findAddonsByNameOrId` is declared `(addonIdOrRealIdOrName, ownerNameOrId)`
  (`ids-resolver.js:100`) and called with one argument from `config-provider.js:14` and
  `operator.js:49`. It works because `undefined == null`, but the parameter should be marked optional.
  Same for `linkMember`'s `label` (`ng-resources.js:107`, called with three arguments from
  `ng.link.command.js:19`).
- **Result mutation.** `src/models/addon.js:171` mutates the client's `Addon` result
  (`createdAddon.env = environment`) to smuggle the environment through to
  `addon.create.command.js:177`. Returning `{ addon, environment }` would keep the command's own shape
  and stop the `Addon` type from being wrong.
- **Silent fallback.** `src/models/ng.js:184` reads `f.domainName || f.label` on a search-result union
  where only `Member` carries `domainName`. Correct at runtime, but the fallback hides the other cases.
---

## Done

- **`--event` completes every event type, not just the meta ones.** The client exports
  `NOTIFICATION_EVENT_TYPES` as a runtime array since `2b3dc0e`, but the option's completion only
  consumed `NOTIFICATION_META_EVENT_TYPES`, so the 21 concrete event names a notification can be
  restricted to were undiscoverable from the shell.

  `listMetaEvents()` became `listEventTypes()` (`src/models/notification.js`) and returns the meta
  events followed by the full list — meta first because they cover a whole family and keep working
  when the platform adds an event.

- **8. The clients no longer snapshot the credentials.** `ccApiClient` and `ccApiBridgeClient` were
  built at import time, copying `config.token`, `config.secret` and `config.API_HOST` out of the
  config object, so `reloadConfig()` no longer reached them — master's `sendToApi` read `config.token`
  per request. Nothing triggered it (`login`, `profile switch` and `logout` make no API call after
  saving), but it was a trap for the next command that did.

  The two instances are gone; `src/models/cc-api-client.js` now exports a single `clients` object with
  a `ccApi` and a `ccApiBridge` getter. Each getter builds its client on first use and rebuilds it
  whenever the host, consumer credentials or OAuth tokens it was built from change, so a caller always
  gets a client that matches the current config, and the 80 call sites moved from `ccApiClient.send(…)`
  to `clients.ccApi.send(…)`.

  Rebuilding on change rather than per access is what keeps `CcApiClient`'s `ResourceIdResolver` cache
  alive: a fresh client carries a fresh `MemoryStore`, so constructing one per call would re-resolve
  every owner and addon ID over the network. Getters on the `oauthTokens` object would have been a
  smaller diff — `CcAuthOauthV1Plaintext` keeps that object by reference and reads it per request —
  but `CcClient` copies `baseUrl` into a private field in its constructor, so `API_HOST` can only be
  kept current by rebuilding the client.

- **7. `clever status` no longer swallows every error.** `getDeploymentCommit` caught everything with
  `.catch(() => null)`, so a 401, an expired token or a dead network all rendered as `Commit: N/A`
  next to an otherwise complete status line — the one output that looks like an answer while hiding
  that the request failed. It is now `tolerateNotFound`, which is the narrow version of the same
  intent: a deployment the API answers 404 for is a legitimate state (the instance outlives its
  deployment record), and it still resolves to `undefined`, so `commit` keeps rendering `N/A` in that
  case only. Everything else propagates to the top-level handler and gets worded.

  The two calls no longer chain: `upInstances`/`deployingInstances` are both computed first, then one
  `Promise.all` covers both `getDeploymentCommit` calls. They were always independent — the second
  waited on the first for no reason. A stopped app with a deployment in progress now costs one round
  trip instead of two, and an app with neither still costs zero (the `deploymentId == null` guard
  returns before sending).

- **13. The two `--format json` breaks that only the client could fix.** Both were transforms losing
  information before the CLI ever saw it, and both are fixed in `clever-client.js`; this branch runs
  against a local pack of it.

  `log-transform.ts` copied `zone` but not `region`. The two are separate fields of the avro record
  (`core/src/main/avro/application_log.avsc`), the shipper sets both (`.region = "EU"`,
  `.zone = "PAR"`), `ovd` carries both through `ApplicationLog` and `ResourceLog`, and master printed
  both. `transformApplicationRuntimeLog` and `transformAddonRuntimeLog` now copy `region` again.
  `convertBaseAccessLog` deliberately still drops it: `AccessLogView` hardcodes both `region` and
  `zone` to `""`, so there is nothing to lose.

  `transformEmailNotification` read `payload.events?.sort() ?? []`, `payload.scope?.sort() ?? []` and
  `payload.notified?.map(…) ?? []`, so a hook the API answers without those keys — which is how it
  says "every event", "the whole organisation", "the whole team" — became indistinguishable from one
  whose list is genuinely empty. `clever notify-email` needs the distinction: master printed `['ALL']`
  for the first and `[]` for the second. The three `?? []` are gone and `targets` joined `events` and
  `scopes` as optional, which also settles a contradiction inside the client — those two were already
  declared optional and documented as "Absent means every event", and the sibling
  `transformWebhookNotification` had always passed them through untouched, which is why
  `clever webhooks` never had the bug.

  `notify-email.command.js` is back on master's three expressions verbatim, and
  `notify-email.command.test.ts` pins both halves: `notif_2` (no `scope`, `events` or `notified` key)
  renders `[ownerId]` / `['ALL']` / `['whole team']`, and a new case covers a hook whose three lists
  are explicitly empty and stay that way.

  That the API omits rather than empties was checked against it, not assumed. No unrestricted hook on
  any organisation carries a `scope` key, and a hook created with `clever notify-email add` without
  `--event` reads back as
  `{"id":…,"name":"cli-audit-probe","notified":[{"type":"organisation"}],"createdAt":…}` — no `events`
  key at all. Through the CLI it renders `events: ['ALL']`, `services: [ownerId]`,
  `notified: ['whole team']`, which is master's output exactly. The probe hook was deleted afterwards.
- **1. The CLI starts again.** `src/commands/drain/drain.check.command.js` came from master's
  `efb6fc13` importing `../../models/send-to-api.js`, which this branch deletes; since
  `src/commands/global.commands.js:42` imports it eagerly, *every* `clever` invocation died at module
  resolution. It now sends the client's `CheckLogDrainCommand`
  (`cc-api-commands/log-drain/check-log-drain-command.js`), whose input is
  `ApplicationOrAddonId & { drainId }` and whose output is `LogDrainProbeResult`
  (`{ ok, code, message }`) — the shape the sibling drain commands already use:

  ```js
  const probe = await ccApiClient.send(new CheckLogDrainCommand({ ...resource, drainId }));
  ```

  That also fixes the two bugs behind it: the handler no longer destructures a `resourceId` that
  `resolveDrainResource` stopped returning (it spreads `{ ownerId, applicationId }` or
  `{ ownerId, addonId }` straight into the command input), and `src/clever-client/` is deleted — its
  last file was `drains.js`. `getIdsToResolve()` declares `addonId: 'REAL_ADDON_ID'` and
  `resolveDrainResource` already passes `realId`, so no hidden resolution fires. Verified:
  `node bin/clever.js --help` and `clever drain check --help` both run.
- **TLS certificate errors are worded again.** `src/logger.js:197-204` handles
  `DEPTH_ZERO_SELF_SIGNED_CERT`, `SELF_SIGNED_CERT_IN_CHAIN`, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` and
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, which the client started naming in `1a799da`. Master's message is
  restored verbatim, with the code interpolated. Verified against a real Node rejection shape
  (`TypeError: fetch failed` whose `cause.code` is the TLS code): `asNetworkError` names it,
  `networkCode` survives, the logger words it. Bonus over master — the client marks all four
  `do-not-retry`, so `isWorthRetrying()` is `false` and the deployment polling in
  `src/models/deployments.js` no longer burns five attempts on a trust-store problem.
- **2. `clever drain create betterstack` works again.** `src/commands/drain/drain.create.command.js:116`
  was master's `body.recipient.sourceToken = sourceToken;`, which came back verbatim through the rebase
  into a handler that no longer has a `body` in scope — the migration builds the payload as `target`,
  mirroring the client's own `recipient` → `target` rename, and every other branch writes `target.*`.
  It now reads `target.sourceToken = sourceToken;`.

  The client supports Better Stack end to end, so nothing else was missing: `BetterStackDrainTarget`
  (`{ type: 'BETTERSTACK', url, sourceToken }`) is part of the `LogDrainTarget` union, and
  `log-drain-transform.js` maps `sourceToken` both ways — out to `body.recipient.sourceToken` on
  create, back from the payload on read. `DRAIN_TYPES.BETTERSTACK` is in `src/models/drain.js:24`, so
  listing and reading Better Stack drains already worked. Verified: `node --check` on the file and
  `clever drain create --help`; the create call itself still needs a live run.
- **3. `clever accesslogs --format clf` emits lines again.** `src/lib/access-logs-clf.js` came from
  master untouched and read the old stream payload: `formatClfDate(log.date)` called `getUTCDate()` on
  what the client now delivers as an **ISO string**, and the request line and status code came from a
  `log.http` section the client renamed to `log.detail`. `formatClfDate` now takes the ISO string and
  builds its own `Date`, and `formatClf` reads `log.detail.request.{method,path}` and
  `log.detail.response.statusCode`. `log.source.ip` and `log.bytesOut` were already correct, and the
  `@param {object}` is now the client's `ApplicationAccessLog`, so `tsc` covers the shape.

  The `if (log.http == null) break;` guard in `accesslogs.command.js` went with it: it was written for
  the old payload where a TCP redirection or an early-cut connection arrived without an `http` section.
  The client's `transformApplicationAccessLog` returns `undefined` for anything that is not HTTP and
  `LogsStream.onLog` skips those, so the handler only ever sees HTTP logs — the guard was matching
  `undefined` on *every* log and silently dropping the whole stream. Verified: `formatClf` against a
  log in the client's shape yields the canonical
  `127.0.0.1 - - [10/Oct/2000:13:55:36 +0000] "GET /apache_pb.gif" 200 2326`, with quote and backslash
  escaping intact.
- **4. `clever profile` degrades on an expired token again.** `src/lib/profile.js:66` caught
  `error?.cause?.response?.status === 401`, the shape `sendToApi`'s `processError` produced by wrapping
  client errors in `new Error(…, { cause })`. The new client raises `CcHttpError` directly — `.statusCode`
  and `.response`, no `cause` — so the branch never matched, the error rethrew, and the
  `'Invalid or expired token'` path in `formatProfileDetails` was unreachable. It now uses
  `isCcHttpErrorWithStatus(error, 401)` from `@clevercloud/client/utils/error-utils.js`, the predicate
  `src/logger.js:137` already uses for the same question. Verified against a local server answering the
  two `GetProfileCommand` / `GetCurrentOauthTokenInfoCommand` calls: a 401 yields
  `isTokenValid: false`, a 500 still rejects.
- **`drain check`, the non-TTY prompt hints, git worktree guidance and the positional-argument fix**
  all landed through the rebase.

---

## Verified clean — no need to re-check

- **Owner and add-on id resolution.** Every command whose `getIdsToResolve()` is non-null receives an
  explicit `ownerId`, and every site declaring `addonId: 'REAL_ADDON_ID'` receives a real id
  (`resolveAddon().realId`, `operator.id`, the config-provider `realId`). The client's built-in
  `ResourceIdResolver` — which is always constructed and `MemoryStore`-backed whether or not you adopt
  it — therefore never fires a hidden `/v2/summary` and never raises `CANNOT_RESOLVE_RESOURCE_ID`.
  This was the main class of breakage looked for, and it is not there.
- `cancel-deploy` correctly sends the legacy numeric `index`, not the `deployment_<uuid>` id, despite
  what the client's JSDoc for `deploymentId` suggests.
- `redeploy`'s `useCache: withoutCache ? false : null` maps to the `useCache=no` query parameter as
  intended.
- `activity --show-all` passes `limit: undefined` where master passed `limit: null`; `QueryParams`
  drops both, so behaviour is unchanged (the backend still caps at 10 either way).
- Email address fields (`address`, `isVerified`), `curl`'s PLAINTEXT OAuth header, the operator
  `resources` / `api` / `features` shapes, and `Application`'s `commitId` / `deployment.url` /
  `deployment.httpUrl` all match what the code reads.
- Stream errors reach `Logger.error` through the top-level handler in `src/lib/cliparse-patched.js:23`,
  so the 401 / network / TLS wording applies to `logs` and `accesslogs` too.
- Swept for other old-client shapes (`resourceId`, `.recipient`, `status.status`, `creationDate`,
  `shortDesc`, `regions`, `fqdn`, `.cause?.response`): none left (item 1 carried the last
  `resourceId`, item 3 the last `.http`, item 4 the last `.cause?.response`).
