# clever-tools changelog


## [3.6.1](https://github.com/CleverCloud/clever-tools/compare/3.6.0...3.6.1) (2024-04-18)


### 🐛 Bug Fixes

* **build:** fix npm package ([df30809](https://github.com/CleverCloud/clever-tools/commit/df308095e9e3af7dc78ecb1f4a2bffbeffbe9a38)), closes [#729](https://github.com/CleverCloud/clever-tools/issues/729)

## [3.6.0](https://github.com/CleverCloud/clever-tools/compare/3.5.2...3.6.0) (2024-04-16)


### 🚀 Features

* **logs:** support SD-PARAM RFC5424 for UDP and TCP drains ([38407ad](https://github.com/CleverCloud/clever-tools/commit/38407adff14c5d49581181b37afadb9b8e41ea24))


### 🐛 Bug Fixes

* **addon:** add TLS param to MateriaDB KV connect info ([dcd01c1](https://github.com/CleverCloud/clever-tools/commit/dcd01c1ab2b0eb93a9ec9063d21f393216d95b4c))
* **addon:** allow json format in new list subcommand ([cec0e85](https://github.com/CleverCloud/clever-tools/commit/cec0e8567286e1b56459fbc5e53da91b8ad7765b))
* **logs:** add details about configuration for specific drains ([55054d4](https://github.com/CleverCloud/clever-tools/commit/55054d430c4b2bcec73cbfbd20fe9e63706c82fe))

## [3.5.2](https://github.com/CleverCloud/clever-tools/compare/3.5.1...3.5.2) (2024-04-11)


### 🐛 Bug Fixes

* **curl:** fix clever curl command when used with the auto packaged binary version ([7197f29](https://github.com/CleverCloud/clever-tools/commit/7197f2967ea298672600ed6080f43b6d5e04adf7)), closes [#713](https://github.com/CleverCloud/clever-tools/issues/713)

## [3.5.1](https://github.com/CleverCloud/clever-tools/compare/3.5.0...3.5.1) (2024-04-10)


### 🐛 Bug Fixes

* **build:** fix PKGBUILD template for arch/AUR build ([71d37f0](https://github.com/CleverCloud/clever-tools/commit/71d37f04c50fe592dc8a8ed9e74d8553404faa67)), closes [#708](https://github.com/CleverCloud/clever-tools/issues/708)

## [3.5.0](https://github.com/CleverCloud/clever-tools/compare/3.4.0...3.5.0) (2024-04-08)


### 🚀 Features

* **addon:** enable materia kv ([341a3fa](https://github.com/CleverCloud/clever-tools/commit/341a3fa9b4d74d422750b6755c59dadeb5a584b1))
* **addon:** support JSON format when plotting an add-on list ([d01b3e0](https://github.com/CleverCloud/clever-tools/commit/d01b3e01db9097dad2e77347525a273732c7ffe9))
* **backups:** support JSON format when plotting a backup list ([c51c028](https://github.com/CleverCloud/clever-tools/commit/c51c028b8d25fd25d2bac91e408c63ae3acdfea9))
* **create:** add the ability to create an app as a task ([c217772](https://github.com/CleverCloud/clever-tools/commit/c217772638035cab0c6f26a75c250759ab5d0cdc))
* **curl:** add a clever curl help message ([520d04b](https://github.com/CleverCloud/clever-tools/commit/520d04b08d34acfcb924c81a12fc79b8192b87d0))
* **curl:** list the command in clever help ([b6e18d2](https://github.com/CleverCloud/clever-tools/commit/b6e18d2ec27c372cd34cffd850a29618085c1cf6))
* **database-backups:** rework json backup list ([5cbb381](https://github.com/CleverCloud/clever-tools/commit/5cbb381f11f52ad9f14aa6dca243cb30431f63fb))
* **help:** adjust description for help command ([85b3dec](https://github.com/CleverCloud/clever-tools/commit/85b3decce9ea55cf6b5a21d2eb8a9a8be09da84d))
* **logs:** support duration in since parameters ([a223f3a](https://github.com/CleverCloud/clever-tools/commit/a223f3a77a20c6f062e8003a9548072aff0c657f))
* **logs:** support indexPrefix customization for ElasticSearch log drain ([2dc0bd6](https://github.com/CleverCloud/clever-tools/commit/2dc0bd655b2b49b32bd749d5bf20b22841448446))
* **parsers:** add duration parser ([62d6089](https://github.com/CleverCloud/clever-tools/commit/62d60893dc6214567869b31a54e208656661b634))
* **status:** show instance lifetime (TASK/REGULAR) in status ([5c67aa7](https://github.com/CleverCloud/clever-tools/commit/5c67aa76fe59ac4c242918a83d647eb038ce2fc3))


### 🐛 Bug Fixes

* **logs:** allow real ID for addons with `clever logs` ([b50ae3e](https://github.com/CleverCloud/clever-tools/commit/b50ae3ed8344b99d8f4837700ab6dc440179446f)), closes [#710](https://github.com/CleverCloud/clever-tools/issues/710)
* **logs:** fix logs for addon (when no linked apps) ([8c6d6f1](https://github.com/CleverCloud/clever-tools/commit/8c6d6f1ddc3d9f2c0d8f0bdab2bde9310f3f5f04)), closes [#644](https://github.com/CleverCloud/clever-tools/issues/644)
* **restart:** quieter mode ([e507113](https://github.com/CleverCloud/clever-tools/commit/e507113675de50c4a7e751add270deac8c260f6e))

## [3.4.0](https://github.com/CleverCloud/clever-tools/compare/3.3.0...3.4.0) (2024-02-16)


### 🚀 Features

* **addon-create:** add support for JSON format (-F json) ([334cec5](https://github.com/CleverCloud/clever-tools/commit/334cec56a43e0e511a4eaae17350a6caea912576))
* **create:** add support for JSON format (-F json) ([1f7842a](https://github.com/CleverCloud/clever-tools/commit/1f7842a3a9d0e4f8b1d235f13fd6c5dc06dc0fc0))
* **create:** display name once app (or add-on) is created ([1a3eb9e](https://github.com/CleverCloud/clever-tools/commit/1a3eb9ea9acf44aebc431b617cbf7d522b27d880))
* **create:** make app name optional (use current directory name if not specified) ([0a20393](https://github.com/CleverCloud/clever-tools/commit/0a2039302f8c237616e0ba48de97a2b1de89ec88))
* **deploy:** support tag option ([52ea270](https://github.com/CleverCloud/clever-tools/commit/52ea270b5148d29b5c52d01321541b2227437f0a))
* **logs:** support "json" and "json-stream" formats (for apps only) ([a909959](https://github.com/CleverCloud/clever-tools/commit/a909959314a3d5465d040304b2ee0036b35cde28))


### 🐛 Bug Fixes

* **docker:** inject Docker hub credentials to actions ([e5e546e](https://github.com/CleverCloud/clever-tools/commit/e5e546e88d5ff5f93de1384615619b883ea278bc))

## [3.3.0](https://github.com/CleverCloud/clever-tools/compare/3.2.0...3.3.0) (2024-02-15)


### 🚀 Features

* add new Gravelines HDS region to autocomplete ([fbebd40](https://github.com/CleverCloud/clever-tools/commit/fbebd406f674bbebc1e9e88a84f2e8270e6b0f7a))


### 🐛 Bug Fixes

* **logs:** show addon logs when addonId is provided ([6fb99d5](https://github.com/CleverCloud/clever-tools/commit/6fb99d591c0832e0cfb556f208ae479932b8d5af))

## [3.2.0](https://github.com/CleverCloud/clever-tools/compare/3.1.0...3.2.0) (2024-02-07)


### 🚀 Features

* **logs:** enable auto retry on network failures ([ccab160](https://github.com/CleverCloud/clever-tools/commit/ccab160f61778ce49f9a364d5207e1d48f51d923))


### 🐛 Bug Fixes

* **api:** improve error message with `EAI_AGAIN` and `ECONNRESET` ([b134213](https://github.com/CleverCloud/clever-tools/commit/b134213f30d46dd7f5690a38425deb4fd752148c))
* delete beta/Jenkins mentions in README.md ([cb32b3b](https://github.com/CleverCloud/clever-tools/commit/cb32b3b0cdaecac5d6198f295eef7c350161ac03))
* **logs:** improve error message with `EAI_AGAIN` and `ECONNRESET` ([fada067](https://github.com/CleverCloud/clever-tools/commit/fada06771369173e579f5fd3a708ff3cef40c95f))
* **logs:** improve open and error debug message ([28dd996](https://github.com/CleverCloud/clever-tools/commit/28dd9968bec8de9545c6b940be732d3f8f87a8f9))
* **logs:** increase connection timeout ([a4ec4b9](https://github.com/CleverCloud/clever-tools/commit/a4ec4b90b5d3938e27679edeb7d375281def3776))
* **logs:** only print SSE errors as debug when verbose mode is enabled ([3ea21c6](https://github.com/CleverCloud/clever-tools/commit/3ea21c6a4ff75db8df5f8177bba10ef17c2962e0))

## [3.1.0](https://github.com/CleverCloud/clever-tools/compare/3.0.2...3.1.0) (2024-01-25)


### 🚀 Features

* **applications:** display git+ssh deployment URL ([8c702ce](https://github.com/CleverCloud/clever-tools/commit/8c702ce94c6d4f018bc1b819cee6a0ed7486b050)), closes [#619](https://github.com/CleverCloud/clever-tools/issues/619)
* **deploy:** add same-commit-policy option ([76ff6a2](https://github.com/CleverCloud/clever-tools/commit/76ff6a2fd183ee2ba0cb30dce6d07d3ae3e515cc))
* **deploy:** log application and owner details ([e5929ae](https://github.com/CleverCloud/clever-tools/commit/e5929aee0f015337fc2664224772d2a0a0301d39))
* update runtimes list in autocomplete ([f02f50f](https://github.com/CleverCloud/clever-tools/commit/f02f50f4ea1d887b4bd7ccafc36e72077ff0ab13))
* update zones list in autocomplete ([3b18adb](https://github.com/CleverCloud/clever-tools/commit/3b18adbdda2c69ac1f6d5bf77604849f5d4033d0))


### 🐛 Bug Fixes

* add an alias/name check during app create ([4a5201a](https://github.com/CleverCloud/clever-tools/commit/4a5201aca2ee3225a9b086212bd28a2295089126)), closes [#656](https://github.com/CleverCloud/clever-tools/issues/656)
* **addon:** fix a typo ([8ece4cd](https://github.com/CleverCloud/clever-tools/commit/8ece4cd56946ada1f2b6bc6f091f103b3fce1c33))
* **domain:** use response object to access status ([18fba08](https://github.com/CleverCloud/clever-tools/commit/18fba08665ce3e133d68c06db26580d2cc43d7c2))
* pass an HTTP agent with long timeout to isomorphic-git ([1bfbf40](https://github.com/CleverCloud/clever-tools/commit/1bfbf40d388cc78c9b987d3717ecd8b4e1bfe803)), closes [#640](https://github.com/CleverCloud/clever-tools/issues/640)

## 3.0.2 (2023-11-01)

* chore: update @clevercloud/client to 8.0.2 (fix Node.js < 18.16 abort bug)

## 3.0.1 (2023-10-19)

* Move from Node.js v18.5.0 to v18.15.0

## 3.0.0 (2023-10-19)

### ⚠ BREAKING CHANGES

* Move from Node.js v12.22.8 to v18.5.0

### Features

* add config file and auth source to `clever diag`
* add shell to `clever diag`
* improve `clever diag`, display (color and details) for oAuth token and user ID
* `clever deploy`: use new logs API (faster, longer, order)
* `clever restart`: use new logs API (faster, longer, order)
* `clever logs`: use new logs API (faster, longer, order), only for applications for now

## 2.11.0 (2023-07-25)

* skip preorder step on addon creation
* add `clever addon env` command
* improve implicit ID params (owner and add-on ID / real ID) for `clever database`

## 2.10.1 (2023-02-20)

* `clever database` command
  * Improve output when trying
* `clever database backups` command
  * Improve output when there are no backups yet
  * Fix command with personal orga
  * Improve example for `database-id` option

## 2.10.0 (2023-02-16)

* add `clever database backups DATABASE-ID` command to list backups of a database
* add `clever database backups download DATABASE-ID BACKUP-IP` command to download a backup
* add `clever curl` so we can prefix any `curl` command with `clever` and benefit from the local oAuth v1 auth

## 2.10.0-beta.2 (2022-09-13)

* NetworkGroups fix wrong function call.

## 2.10.0-beta.0 (2022-09-06)

* Add NetworkGroups commands `clever ng --help`

## 2.9.1 (2022-02-28)

* Upgrade opn to open

## 2.9.0 (2022-01-12)

* Add NewRelic support in `clever drains`

## 2.8.1 (2022-01-10)

* Fix `colors` to `1.4.0`

## 2.8.0 (2021-02-09)

* Add options support for `clever addon create` (options like encryption-at-rest)
* Display available versions in `clever addon providers show <provider>`
* Display available options in `clever addon providers show <provider>`
* Fix `clever deploy` which was displaying logs from runtime instances
* Fix `clever accesslogs` so it doesn't fail when source object is undefined
* Prevent race conditions on parallel CI configs with `clever deploy` and git add remote
* Format `.clever.json` (Mickael Chanrion)

## 2.7.2 (2020-10-09)

* addon: fix create relying on default region

## 2.7.1 (2020-08-21)

* Fix linux-release-info usage in `clever diag`

## 2.7.0 (2020-08-20)

* Improve `clever deploy` perfs in several cases (partial push, force push...)
  * NOTE: Pushing a brand new repo is still slow in some situations
* Add commands for favourite domains (Julien Tanguy)
  * `clever domain` now displays a star prefix `*` before the favourite domain in the list
  * `clever domain favourite` just displays the favourite domain (no prefix)
  * `clever domain favourite set example.com` sets the favourite domain to `example.com`
  * `clever domain favourite unset` unsets the favourite domain for this app
* Add a message while waiting for deploy to start `clever deploy` and `clever restart`
* Add shallow detection with appropriate error message for `clever deploy`
* Fix `clever status` typo in output (Clément Delafargue)
* Fix `clever env` error message when JSON input is incorrect (Jean Baptiste Noblot)
* Update dependencies

This is the one with the latest isomorphic-git!!!

## 2.6.1 (2020-05-29)

* Fix `clever restart` default cache behaviour and option `--without-cache`
* Fix `clever config` docs wording (Clément Delafargue)

## 2.6.0 (2020-05-28)

* Add `--addon` option for all `clever drain` commands

## 2.5.0 (2020-05-26)

* Add `clever config` command to configure application options
  * Existing supported options: `name`, `description`, `zero-downtime`, `sticky-sessions` and `cancel-on-push`
  * New supported option: `force-https`
* Add `--follow` to `clever deploy` and `clever restart` so you can continue to follow logs after the deployment is finished
* Fix #318 where `clever deploy` and `clever restart` would sometimes never exit
   * We changed the way we detect when a deployment is finished
* Fix #304 where `clever logs` would run endlessly even when using `--before/--until`

### Internals

* We completely removed our dependency to Bacon.js, goodbye old friend 😘
* `@clevercloud/client` was updated to `6.0.0` so we can use the new event based API for logs and events

## 2.4.0 (2020-04-16)

* Add `--json` option to `clever env import` and `clever published-config import` (Clément Delafargue)

## 2.3.0 (2020-03-30)

* Add `clever tcp-redirs` command to configure TCP redirections

## 2.2.3 (2020-03-30)

- Fix `link` when app ID is not in personal space

## 2.2.2 (2020-03-28)

- Fix `login` and `logout` commands, update mkdirp usage (new version returns a promise)

## 2.2.1 (2020-03-27)

### For users

- Fix drain type autocomplete
- Always save `org_id` in `.clever.json` with `clever link`
- Add on API calls when `CLEVER_VERBOSE` is enabled

### Internals

We did a bit refactor in the codebase, less bacon, more promises and no more legacy clever-client!!

- Remove Bacon from `Interact.confirm()`
- Update @clevercloud/client to 5.0.1 (with fixed/improved function names)
- Add `getAppDetails()` in app_configuration
- Cleanup in models/addon
- Cleanup in models/application
- Cleanup in models/organisation
- Refactor `clever addon` (less Bacon, more promise)
- Refactor `clever applications` (less Bacon, more promise)
- Refactor `clever cancel-deploy` (less Bacon, more promise)
- Refactor `clever console` (less Bacon, more promise)
- Refactor `clever create` (less Bacon, more promise)
- Refactor `clever delete` (less Bacon, more promise)
- Refactor `clever deploy` and `clever restart` (less Bacon, more promise)
- Refactor `clever domain` (less Bacon, more promise)
- Refactor `clever link` (less Bacon, more promise)
- Refactor `clever logs` (less Bacon, more promise)
- Refactor `clever service` (less Bacon, more promise)
- Refactor `clever ssh` (less Bacon, more promise)
- Refactor `clever stop` (less Bacon, more promise)
- Refactor `clever unlink` (less Bacon, more promise)
- Refactor `make-default` command (less Bacon, more promise)
- Remove legacy clever-client usage with API client injection
- Remove unused `getAppData()` from app_configuration
- Use `getAppDetails()` in `clever accesslogs`
- Use `getAppDetails()` in `clever activity`
- Use `getAppDetails()` in `clever drain`
- Use `getAppDetails()` in `clever env`
- Use `getAppDetails()` in `clever open`
- Use `getAppDetails()` in `clever published-config`
- Use `getAppDetails()` in `clever scale`
- Use `getAppDetails()` in `clever status`
- Use `getAppDetails()` in notification model

## 2.2.0 (2020-03-26)

* Alias `after/before` to `since/until` in commands `logs` and `accesslogs`
* Fix `clever accesslogs` with `--before` and/or `--after` params

## 2.1.1 (2020-03-24)

* Fix `clever scale --build-flavor`

## 2.1.0 (2020-03-20)

* Add `clever accesslogs` command to get history and contiuous access logs for apps and add-ons (fix #360)
* Improve `clever notify-email` options handling and help
* Warn about node version if there is an error
* Enable small image for release via docker image

## 2.0.0 (2020-03-06)

* Enable node engines >=12 (fix #358)
* Add elixir in autocomplete (fix #359)
* Add new `clever env import-vars FOO,BAR,BAZ` command
* Handle error when the .git folder is not found (fix #357) (Sacramentix)

### ⚠️ BREAKING CHANGES

* Update @clevercloud/client to 3.0.0 (fix env-var parsing/serialization)

Be careful if you use `clever env import` with `2.0.0` with a file that was generated with an older version.

Please read [PR 18](https://github.com/CleverCloud/clever-client.js/pull/18) for more details.

## 1.6.3 (2020-03-03)

- Fix git commit display before a `clever restart` (for new empty repos)
- Fix issue when config dir does not exist
- Fix error handling (like ECONNRESET) via `@clevercloud/client@2.3.1`
- Fix some connection errors via `@clevercloud/client@2.3.1`

## 1.6.2 (2019-10-03)

- Fix git commit diplay just before a `clever deploy` (for new empty repos)

## 1.6.1 (2019-09-30)

- Fix: Look for `.git` recursively so you can `clever deploy` from subdir

## 1.6.0 (2019-09-27)

- Improve error stack in verbose mode
- Use same color display for commits in `clever restart` and `clever deploy`
- Add details about commits on `clever deploy`
- Make `clever open` default to https://fqdn
- Add `clever diag` command to get various infos to help support
- Add user id in `clever profile`

## 1.5.1 => 1.5.2

- Moving our releases to another cellar

## 1.5.0 (2019-09-02)

See previous beta releases

## 1.5.0-beta.15 (2019-08-30)

- Add `--build-flavor` to `clever scale` (Clément Delafargue)
- Add dedicated build details to `clever status`

## 1.5.0-beta.14 (2019-08-29)

* Replace superagent bintray upload with vanilla node
* Add 2XL and 3XL flavors

## 1.5.0-beta.9 => 1.5.0-beta.13

These release were only created for some tests on our CI pipeline.

## 1.5.0-beta.8 (2019-08-28)

- Rollback open module to opn (waiting for bugfix)
- Update @clevercloud/client (fix SSE)

## 1.5.0-beta.7 (2019-08-23)

- Use new @clevercloud/client auto-retry streams (logs & events)
- Fix "opn" module renamed to "open"
- Fix split error on logger

## 1.5.0-beta.6 (2019-08-02)

- Log error trace in --verbose mode
- Update deps (rename opn => open)
- Fix logs with `clever deploy` (update @clevercloud/client to 2.0.0-beta.1)
- Fix typo "connexion" => "connection" in logs and README

## 1.5.0-beta.5 (2019-08-01)

### For users

- Fix `--verbose` global param
- Docs: Add 'gitter' in webhooks format
- Fix bug with `colors` module in `clever notify-email`
- Improve some error messages in `clever webhooks` and `clever notify-email`
- `--notify` is now required for `clever notify-email`

### Internals

- Remove legacy getAuthorization
- Refactor send-to-api token loading
- Use @clevercloud/client superagent helper instead of request
- Refactor logout into promise mode
- Replace request with superagent
- Use @clevercloud/client prepareEventsWs
- Use new SSE endpoint for logs (#207)
- Use @clevercloud/client directly for GET /logs/{appId}
- Use @clevercloud/client directly in drain
- Use @clevercloud/client directly in notify-email and webhooks
- Rename functions in notify-email and webhooks
- Split notifications into notify-email and webhooks
- Ease testing for preprod with comments in config
- Update @clevercloud/client to 2.0.0-beta.0

## 1.5.0-beta.4 (2019-07-25)

- Fix --add-export option for `clever env`

## 1.5.0-beta.3 (2019-07-24)

- Update to @clevercloud/client@1.0.1 (fix for JSON requests)

## 1.5.0-beta.2 (2019-07-24)

- Rollback isomorphic-git to 0.37.0 (for now)

## 1.5.0-beta.1 (2019-07-24)

- Update @clevercloud/client (env-var util sorts variables now)
- Upgrade node version to 12

## 1.5.0-beta.0 (2019-07-23)

- Use new `@clevercloud/client` to make HTTP requests (via legacy wrapper) everywhere
- Use new `@clevercloud/client` to make HTTP requests (directly) in `env` and `published-config` commands
- Use new parsing/validation from `@clevercloud/client` in `env` and `published-config` commands
  - `clever env import` and `clever published-config import` now report detailed errors
  - `clever env set` and `clever published-config set` now report invalid name errors
  - `clever env import` and `clever published-config import` of multiline variables works!!
- Update deps
  - New `isomorphic-git` should improve `clever deploy` perfs
- Update docs about `clever env import`

## 1.4.2 (2019-05-15)

- Fix wrong auto-scalability setting in `clever status` (mpapillon)
- Fix `clever service link-app` (mpapillon)
- Update dependencies

## 1.4.1 (2019-03-28)

- Improve README.md sections about drains
- Fix errors when using `clever activity` with non TTY stdout (haitlahcen)
- Remove leftover console.log in `clever env import` (Clément Delafargue)

## 1.4.0 (2019-03-19)

- Depreciate datadog tcp drain, and remove creation of them
- Add datadog http drain

## 1.3.0 (2019-01-11)

- Fix endless wait with `clever login` on MacOS (Renan Decamps)
- Fix wrong activity display for WIP
- Always do a process.exit(0) when a command finishes properly
- Limit the number or retries for when a WebSocket connection fails

## 1.2.1 (2018-11-23)

- Fix packaging problems with exherbo, docker and homebrew

## 1.2.0 (2018-11-23)

- Add datadog drain

## 1.1.1 (2018-11-09)

- Rollback isomorphic-git to 0.37.0 (for now)
- Fix `slugify` function used to create alias from names

## 1.1.0 (2018-10-30)

- Fix bad usage of bacon.js in 1.0.2
- Add docker image and publish it at docker hub

## 1.0.2 (2018-10-19)

- Fix wrong name displayed after a login if you were already logged in as someone else

## 1.0.1 (2018-10-18)

- Fix unspecified name display as null in `clever login` and `clever profile`
- Fix open webpages on windows: use `opn` npm package instead of custom code

## 1.0.0 (2018-10-15)

### User features

- Add `clever logout` command to destroy local token/secret (Corentin Grall)
- Add `clever console` command to open the Web console on the project page (Corentin Grall)
- Add `clever version` command
- Simplify login process: users no longer need to copy/paste token and secret
- Display "clever restart --commit ..." hint when a simple restart won't do what the user wants
- Fix drain creation authorization (Sébastian Le Merdy)
- Display `[ERROR]` keyword in red when an error occurs

### CI/CD features

- Implicit login when env vars `CLEVER_TOKEN` and `CLEVER_SECRET` are present
- Exit process with status 1 when an error occurs
- Forward all error logs to stderr

### Technical improvements

- Replace [nodegit](https://github.com/nodegit/nodegit) with [isomorphic-git](https://github.com/isomorphic-git/isomorphic-git)
- Add ESLint config with a big refactoring to go along
- Always use the npm `colors` package in safe mode: no global `String` pollution
- Build, package and publish with a multibranch pipeline project on Jenkins

### Packaging & distribution

- Add a directory in tar.gz and zip archives, the clever binary is in this directory
- Publish `.rpm` and `.deb` packages (Thibaud Lepretre)
- Publish exherbo packages
- Publish chocolatey packages automatically
- Publish npm package, it's back!
- Introduce beta releases: npm, rpm, deb, archlinux, exherbo, chocolatey, homebrew...

## 0.10.1 (2018-01-16)

 - Add `clever env` to display app dependencies environment variables (fixes #165)
 - Add `clever profile` to display infos about current logged in user (name, email 2FA) (fixes #161)
 - Add `-i` option to `clever ssh` to provide identify file (fixes #164)
 - Show commit about to be redeployed (fixes #145)
 - Ignore parent ".clever.json" with `clever create` (fixes #179)
 - Normalize (slugify) alias and git remote names (fixes #166)
 - Fix logger and console (fixes #134)
 - Update to latest nodegit (and fix node version to 8.3.0)
 - Fix libss/openssl install docs (Adrien Duclos)
 - Add MacOS installation docs (Antonio Goncalves)

## 0.9.2 (2017-09-15)

 - Ignore disabled variants and only match on variants
 - Use the variant's default flavor when creating an app

## 0.9.1 (2017-09-14)

 - Fix app creation for java variants (jar, war, …)
 - Use app type default flavor instead of hardcoded "S"

## 0.9.0 (2017-08-18)

 - Provide standalone version
 - Fix premature exit in `clever deploy`
 - Fix connection issues with websocket connections
 - Display addonId upon addon creation (Philippe Charrière)
 - Add `--addon` option to `clever logs` (Alexandre Duval)
 - Logs drain management
 - Allow internal addon ids in `clever addon`
 - Fix autocompletion issue with flag names

## 0.8.3 (2017-05-30)

 - Unlink applications when deleting them (fixes #124)
 - Make `install-clever-completion` work on Mac OS (Cédric Corbière)
 - Allow non-interactive login (fixes #128)
 - Filter logs by deployment in `clever logs`
 - Only display logs for the current deployment in `clever deploy` and `clever restart`
 - Fix hanging in `clever restart` (fixes #130)

## 0.8.2 (2017-03-22)

 - Fix `clever link` for PHP-FTP applications

## 0.8.1 (2017-03-13)

 - Fix `clever login` on windows

## 0.8.0 (2017-03-06)

 - More information when creating not free addons
 - Better error message in `clever deploy` when the application is up to date
 - Use temporary git remotes when necessary (instead of failing)
 - Keyword search in `clever logs`

## 0.7.1 (2017-02-14)

 - Fix `clever ssh --alias` behaviour
 - Fix installation on windows systems

## 0.7.0 (2017-02-07)

 - Fix addon creation in the right organisation
 - Add command to delete an application
 - Handle websocket errors (logs, events)
 - Add command to SSH to an application / instance
 - Sort autocomplete results in instanceTypes
 - Add support for Node 7.x (nodegit dependency bump)
 - Drop support for Node <4

## 0.6.1 (2016-10-24)

 - Support for email notifications
 - Simplify installation (dropped dependency on node-expat)

## 0.6.0 (2016-10-06)

 - Better support for CCAPI error messages
 - Warn users using an out-of-date version
 - Favor using git over HTTPS
 - Support for webhooks

## 0.5.3 (2016-09-23)

 - Add format description for date parameters in `clever logs` (Corentin
   Cailleaud)
 - Fix `clever env import`
 - Fix `clever make-default`

## 0.5.2 (2016-07-27)

 - Fix default domain name choice in `clever open`
 - Allow to choose a specific commit in `clever restart`
 - Allow to restart an application without using cache

## 0.5.1 (2016-07-07)

 - Update readme with `0.5.0` changes
 - Update completion and documentation for new java instances
 - Fix issue with installation on ubuntu machines
 - Fix `clever scale` behaviour

## 0.5.0 (2016-06-24)

 - Node 6 support (Arnaud Lefebvre)
 - More friendly way to specify applications, organisations and addons by name
   instead of ids. The syntax `org_name/app_name` is now deprecated
   (issues #51/#67)
 - Add support for service dependencies with `clever service` and `clever
   published-config` commands (issue #55)
 - Add `--before` and `--after` flags to `clever logs` to fetch logs at a
   specific date/time (issue #49)
 - Let the user create a github-linked application (issue #64)
 - Let the user set a default application (issue #30)
 - `clever addon` commands are now relative to owners, not applications
 - Add `clever open` to open an application in the browser (issue #43)
 - Rename command `list` to `applications` (issue #31)
 - Automatically reconnect websocket when the connection is closed (Arnaud
   Lefebvre)
 - Use mocha to run tests (Arnaud Lefebvre)

## 0.4.0 (2016-01-06)

 - Add `clever restart` command to restart a running application (Clément Delafargue)
 - Add `clever scale` command to edit scalability settinsg (Benjamin Drouard)
 - Forward compatible support for new application creation API (Julien Durillon)
 - Various bug fixes / UX improvements (Clément Delafargue, Marc-Antoine Perennou)

## 0.3.4 (2015-10-15)

 - Support for node v4 (Alexandre Berthaud)
 - Support being called from a directory (Alexandre Berthaud)
 - Clean up autocompletion installation scripts (Marc-Antoine Perennou)
 - Fix environment variables definition

## 0.3.3 (2015-09-28)

 - Fix crash when pushing for the first time
 - Quit at the end of a deployment with the right exit code
 - Display more information when SSH auth fails

## 0.3.2 (2015-09-23)

 - Fix crash when config files were missing
 - More information in clever login

## 0.3.1 (2015-09-23)

 - Fix postinstall script

## 0.3.0 (2015-09-23)

 - Add color to deployment related log lines
 - Rename `log` command to `logs`
 - Return with error or success status at the end of a deployment in `clever deploy -q`
 - Import & export env variables
 - Only deploy if there is new code to push (overridable with `--redeploy`)
 - Allow to force a deployment with `--force` (à la `git push`)
 - List linked applications with `clever list`
 - Rename an addon
 - Easy autocompletion installation

## 0.2.3 (2015-08-25)

 - Autocomplete local branches in `clever deploy`
 - Add `--follow` option to `clever activity`
 - Status information in `clever deploy -q`
 - Addon support

## 0.2.2 (2015-08-12)

 - Display messages when waiting for logs
 - Better error messages when specifying an alias
 - Use provided alias when creating an application

## 0.2.1 (2015-07-28)

Apply bug fixes from dependencies

## 0.2.0 (2015-07-28)

Initial public release
