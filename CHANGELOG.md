# clever-tools changelog

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
