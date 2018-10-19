# clever-tools changelog

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
