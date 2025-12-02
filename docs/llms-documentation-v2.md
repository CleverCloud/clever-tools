This document is automatically generated from Clever Tools `4.4.0` and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

To use Clever Tools, you need:
- A Clever Cloud account, create one at https://console.clever-cloud.com/
- The Clever Tools CLI installed, see installation instructions below

In CI/CD pipelines or for one-off usage, you can use it through `npx` or `npm exec`:

```bash
# Set/Export CLEVER_TOKEN and CLEVER_SECRET to login with a given account
# --yes is used to skip the interactive prompts
npx --yes clever-tools@latest version
```

You'll also need:

- To be logged in with `clever login` command (you'll get a `$HOME/.config/clever-cloud/clever-tools.json` file)
- git installed on your system and properly configured
- A local git repository with at least one commit to deploy your application

To control an application with Clever Tools, it must be linked to a local directory (a `.clever.json` file is present, containing its `app_id`, `name`, `local alias`, `org_id`, `deploy_url`, `git_ssh_url`). You can target an application on most commands with `--app app_id_or_name` option.

## How to install Clever Tools

Clever Cloud CLI is based on Node.js. We thought it to be easily available on any platform. Thus, you can download Clever Tools as [a npm package](https://www.npmjs.com/package/clever-tools), but also through package managers or as a binary on many systems:

### GNU/Linux

#### Arch Linux (AUR)

If you use Arch Linux, install packages [from AUR](https://aur.archlinux.org/packages/clever-tools-bin/). If you don't know how to use this, run:

```
git clone https://aur.archlinux.org/clever-tools-bin.git clever-tools
cd clever-tools
makepkg -si
```

#### CentOS/Fedora (.rpm)

If you use a GNU/Linux distribution that uses `.rpm` packages like CentOS or Fedora, run:

```
curl -s https://clever-tools.clever-cloud.com/repos/cc-nexus-rpm.repo > /etc/yum.repos.d/cc-nexus-rpm.repo
yum update
yum install clever-tools
```

> [!TIP]
> The `.rpm` packages are hosted on Clever Cloud's public Nexus instance available at [https://nexus.clever-cloud.com](https://nexus.clever-cloud.com)

#### Debian/Ubuntu (.deb)

If you use a GNU/Linux distribution that uses `.deb` packages like Debian or Ubuntu, run:

```
curl -fsSL https://clever-tools.clever-cloud.com/gpg/cc-nexus-deb.public.gpg.key | gpg --dearmor -o /usr/share/keyrings/cc-nexus-deb.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/cc-nexus-deb.gpg] https://nexus.clever-cloud.com/repository/deb stable main" | tee -a /etc/apt/sources.list
apt update
apt install clever-tools
```

> [!TIP]
> The `.deb` packages are hosted on Clever Cloud's public Nexus instance available at [https://nexus.clever-cloud.com](https://nexus.clever-cloud.com). \
> Our PGP key is required to trust the repository

#### Exherbo

If you are using Exherbo, run:

```
cave resolve repository/CleverCloud -zx1
cave resolve clever-tools-bin -zx
```

#### Other distributions (.tar.gz)

If you use another GNU/Linux distribution, download the `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz
tar xvzf clever-tools-latest_linux.tar.gz
cp clever-tools-latest_linux/clever ~/.local/bin/
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_linux.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz). \
>  Retrieve any release by replacing `latest` (path and filename) with the version number you need.

### macOS

We only provide macOS packages for Apple Silicon processors. On an Intel Mac, prefer using `npm` release.

#### Homebrew

If you use macOS and you have [Homebrew](https://brew.sh) installed, run:

```
brew install CleverCloud/homebrew-tap/clever-tools
```

#### Binary (.tar.gz)

If you use macOS, but you don't have [Homebrew](https://brew.sh) installed, download the `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz
tar xvzf clever-tools-latest_macos.tar.gz
cp clever-tools-latest_macos/clever ~/.local/bin/
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_macos.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz). \
> Retrieve any release by replacing `latest` (path and filename) with the version number you need.

### Windows

#### WinGet

If you use Windows run in a terminal:

```
winget install CleverTools
```

#### Binary (.zip)

You can also download the `.zip` archive and extract the binary in your `PATH`:

```PowerShell
Invoke-WebRequest https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip -OutFile clever-tools-latest_win.zip
Expand-Archive .\clever-tools-latest_win.zip -DestinationPath .
$env:PATH += ";$(Resolve-Path .\clever-tools-latest_win\)"
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_win.zip](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip). \
> Retrieve any release by replacing `latest` (path and filename) with the version number you need.

### Docker

If you are using docker, use the image provided [here](https://hub.docker.com/r/clevercloud/clever-tools/).

```
docker pull clevercloud/clever-tools
docker run --rm clever-tools <command>
```

#### Dockerfile

In your `Dockerfile` copy `clever-tools` from the image itself with a simple one liner:

```Dockerfile
COPY --from=clevercloud/clever-tools /bin/clever /usr/local/bin/clever
```

### Nix package manager

If you are using Nix on NixOS or any other compatible system, the package is available in both `stable` and `unstable` channels. Follow [these instructions](https://search.nixos.org/packages?channel=unstable&show=clever-tools&from=0&size=50&sort=relevance&type=packages&query=clever-tools).

## Application types and zones

You can deploy applications on Clever Cloud with the following runtimes type: `docker`, `dotnet`, `elixir`, `frankenphp`, `go`, `gradle`, `haskell`, `jar`, `linux`, `maven`, `meteor`, `node`, `php`, `play1`, `play2`, `python`, `ruby`, `rust`, `sbt`, `static`, `static-apache`, `v`, `war`

Available flavors: `pico`, `nano`, `XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`

Flavor `pico` is not available for the following instances: `docker`, `frankenphp`, `php`, `static-apache`

Applications deployment zones (region): `par`, `fr-north-hds`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

## Add-on providers, plans and zones (region)

- `mysql-addon`:
  - plans: `m_big`, `m_med`, `xxs_big`, `l_big`, `xl_big`, `xxl_sml`, `xxl_hug`, `l_sml`, `xs_tny`, `s_med`, `xs_sml`, `xl_med`, `l_med`, `dev`, `xxl_med`, `xxl_big`, `m_sml`, `xs_big`, `xl_sml`, `s_sml`, `xxs_sml`, `xxs_med`, `xs_med`, `s_big`
  - zones: `par`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `mongodb-addon`:
  - plans: `xl_big`, `xs_med`, `m_big`, `xxl_sml`, `xl_sml`, `s_sml`, `m_sml`, `xxl_med`, `m_med`, `dev`, `s_med`, `xs_sml`, `xl_med`, `l_sml`, `s_hug`, `xs_big`, `m_hug`, `xxl_big`, `l_big`, `l_med`, `s_big`
  - zones: `par`, `ldn`, `mtl`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `config-provider`:
  - plans: `std`
  - zones: `par`

- `otoroshi`:
  - plans: `base`
  - zones: `par`, `fr-north-hds`, `grahds`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `kv`:
  - plans: `base`
  - zones: `par`

- `addon-matomo`:
  - plans: `beta`
  - zones: `par`, `mtl`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `postgresql-addon`:
  - plans: `xs_sml`, `xxs_sml`, `xl_hug`, `xl_sml`, `xs_big`, `3xl_cpu_tit`, `xs_tny`, `xxl_sml`, `xxs_med`, `l_big`, `m_sml`, `l_sml`, `xxxl_sml`, `m_big`, `s_hug`, `xxxl_big`, `xxxl_med`, `l_gnt`, `s_sml`, `xxl_hug`, `xxl_med`, `s_med`, `m_med`, `xxl_big`, `xxs_big`, `l_med`, `xl_med`, `xl_gnt`, `s_big`, `dev`, `xl_big`, `xs_med`
  - zones: `par`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `azimutt`:
  - plans: `team-3`, `team-5`, `solo`, `team-4`, `team-2`, `free`, `team`, `enterprise`
  - zones: `par`

- `mailpace`:
  - plans: `clever_solo`, `clever_scaling_10`, `clever_scaling_50`, `clever_scaling_70`, `clever_scaling_20`, `clever_scaling_30`, `clever_scaling_100`, `clever_scaling_40`
  - zones: `par`

- `keycloak`:
  - plans: `base`
  - zones: `par`, `mtl`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `jenkins`:
  - plans: `M`, `XS`, `L`, `XL`, `S`
  - zones: `par`, `grahds`, `ldn`, `rbxhds`, `scw`

- `cellar-addon`:
  - plans: `S`
  - zones: `par`, `fr-north-hds`, `rbxhds`

- `fs-bucket`:
  - plans: `s`
  - zones: `par`, `ldn`, `mtl`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `addon-pulsar`:
  - plans: `beta`
  - zones: `par`

- `metabase`:
  - plans: `base`
  - zones: `par`, `fr-north-hds`, `grahds`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `es-addon`:
  - plans: `xs`, `xl`, `l`, `4xl`, `xxxl`, `xxl`, `s`, `5xl`, `m`
  - zones: `par`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `redis-addon`:
  - plans: `m_mono`, `xxxxl_mono`, `s_mono`, `l_mono`, `xxxl_mono`, `xl_mono`, `xxl_mono`
  - zones: `par`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

Default deployment zone is `par`, default plan is the lowest available.

# How to use Clever Tools, CLI reference

```
Usage: clever
```

**Description:** CLI tool to manage Clever Cloud's data and products

**Options:**
```
[--color]                          Choose whether to print colors or not. You can also use --no-color (default: true)
[--help, -?]                       Display help about this program (default: false)
[--update-notifier]                Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
[--verbose, -v]                    Verbose output (default: false)
[--version, -V]                    Display the version of this program (default: false)
```

**Note:** The options listed above (`--help`, `--version`, `--color`, `--update-notifier`, `--verbose`) are available for all Clever Tools commands and sub-commands
## accesslogs

```
Usage: accesslogs
```

**Description:** Fetch access logs

**Options:**
```
[--addon] ADDON_ID                 Add-on ID
[--after, --since] AFTER           Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--before, --until] BEFORE         Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

## activity

```
Usage: activity
```

**Description:** Show last deployments of an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--follow, -f]                     Track new deployments in activity list (default: false)
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--show-all]                       Show all activity (default: false)
```

## addon

```
Usage: addon
```

**Description:** Manage add-ons

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### addon create

```
Usage: create ADDON-PROVIDER ADDON-NAME
```

**Description:** Create an add-on

**Options:**
```
[--addon-version] ADDON-VERSION    The version to use for the add-on
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--link, -l] ALIAS                 Link the created add-on to the app with the specified alias
[--option] OPTION                  Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--plan, -p] PLAN                  Add-on plan, depends on the provider
[--region, -r] REGION              Region to provision the add-on in, depends on the provider (default: par)
[--yes, -y]                        Skip confirmation even if the add-on is not free (default: false)
```

### addon delete

```
Usage: delete ADDON-ID
```

**Description:** Delete an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                        Skip confirmation and delete the add-on directly (default: false)
```

### addon env

```
Usage: env
```

**Description:** List environment variables for an add-on

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### addon list

```
Usage: list
```

**Description:** List available add-ons

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### addon providers

```
Usage: providers
```

**Description:** List available add-on providers

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

#### addon providers show

```
Usage: show ADDON-PROVIDER
```

**Description:** Show information about an add-on provider

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### addon rename

```
Usage: rename ADDON-NAME ADDON-ID
```

**Description:** Rename an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## applications

```
Usage: applications
```

**Description:** List linked applications

**Options:**
```
[--json, -j]                       Show result in JSON format (default: false)
[--only-aliases]                   List only application aliases (default: false)
```

### applications list

```
Usage: list
```

**Description:** List all applications

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## cancel-deploy

```
Usage: cancel-deploy
```

**Description:** Cancel an ongoing deployment

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## config

```
Usage: config
```

**Description:** Display or edit the configuration of your application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### config get

```
Usage: get CONFIGURATION-NAME
```

**Description:** Display the current configuration

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### config set

```
Usage: set CONFIGURATION-VALUE CONFIGURATION-NAME
```

**Description:** Edit one configuration setting

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### config update

```
Usage: update
```

**Description:** Edit multiple configuration settings at once

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## console

```
Usage: console
```

**Description:** Open an application in the Console

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## create

```
Usage: create APP-NAME
```

**Description:** Create an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--github] OWNER/REPO              GitHub application to use for deployments
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--region, -r] ZONE                Region, can be ${...} (default: par)
[--task, -T] COMMAND               The application launch as a task executing the given command, then stopped
[--type, -t] TYPE                  Instance type
```

## curl

```
Usage: curl
```

**Description:** Query Clever Cloud's API using Clever Tools credentials

## database

```
Usage: database
```

**Description:** Manage databases and backups

### database backups

```
Usage: backups DATABASE-ID
```

**Description:** List available database backups

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

#### database backups download

```
Usage: download BACKUP-ID DATABASE-ID
```

**Description:** Download a database backup

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--output, --out] OUTPUT           Redirect the output of the command in a file
```

## delete

```
Usage: delete
```

**Description:** Delete an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--yes, -y]                        Skip confirmation and delete the application directly (default: false)
```

## deploy

```
Usage: deploy
```

**Description:** Deploy an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--branch, -b] BRANCH              Branch to push (current branch by default)
[--exit-on, -e] STEP               Step at which the logs streaming is ended, steps are: ${...} (default: deploy-end)
[--follow]                         Continue to follow logs after deployment has ended (default: false)
[--force, -f]                      Force deploy even if it's not fast-forwardable (default: false)
[--quiet, -q]                      Don't show logs during deployment (default: false)
[--same-commit-policy, -p] POLICY  What to do when local and remote commit are identical (${...}) (default: error)
[--tag, -t] TAG                    Tag to push (none by default)
```

## diag

```
Usage: diag
```

**Description:** Diagnose the current installation (prints various informations for support)

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

## domain

```
Usage: domain
```

**Description:** Manage domain names for an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### domain add

```
Usage: add FQDN
```

**Description:** Add a domain name to an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### domain diag

```
Usage: diag
```

**Description:** Check if domains associated to a specific app are properly configured

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--filter] TEXT                    Check only domains containing the provided text
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### domain favourite

```
Usage: favourite
```

**Description:** Manage the favourite domain name for an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### domain favourite set

```
Usage: set FQDN
```

**Description:** Set the favourite domain for an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

#### domain favourite unset

```
Usage: unset
```

**Description:** Unset the favourite domain for an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### domain overview

```
Usage: overview
```

**Description:** Get an overview of all your domains (all orgas, all apps)

**Options:**
```
[--filter] TEXT                    Get only domains containing the provided text
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### domain rm

```
Usage: rm FQDN
```

**Description:** Remove a domain name from an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## drain

```
Usage: drain
```

**Description:** Manage drains

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### drain create

```
Usage: create DRAIN-TYPE DRAIN-URL
```

**Description:** Create a drain

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--api-key, -k] API_KEY            API key (for newrelic)
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--index-prefix, -i] INDEX_PREFIX  Optional index prefix (for elasticsearch), `logstash` value is used if not set
[--password, -p] PASSWORD          Basic auth password (for elasticsearch or raw-http)
[--sd-params, -s] SD_PARAMS        RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`
[--username, -u] USERNAME          Basic auth username (for elasticsearch or raw-http)
```

### drain disable

```
Usage: disable DRAIN-ID
```

**Description:** Disable a drain

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### drain enable

```
Usage: enable DRAIN-ID
```

**Description:** Enable a drain

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### drain get

```
Usage: get DRAIN-ID
```

**Description:** Get drain info

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### drain remove

```
Usage: remove DRAIN-ID
```

**Description:** Remove a drain

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## emails

```
Usage: emails
```

**Description:** Manage email addresses of the current user

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### emails add

```
Usage: add EMAIL
```

**Description:** Add a new secondary email address to the current user

### emails open

```
Usage: open
```

**Description:** Open the email addresses management page in the Console

### emails primary

```
Usage: primary EMAIL
```

**Description:** Set the primary email address of the current user

### emails remove

```
Usage: remove EMAIL
```

**Description:** Remove a secondary email address from the current user

### emails remove-all

```
Usage: remove-all
```

**Description:** Remove all secondary email addresses from the current user

**Options:**
```
[--yes, -y]                        Skip confirmation (default: false)
```

## env

```
Usage: env
```

**Description:** Manage environment variables of an application

**Options:**
```
[--add-export]                     Display sourceable env variables setting (default: false)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### env import

```
Usage: import
```

**Description:** Load environment variables from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

**Options:**
```
[--add-export]                     Display sourceable env variables setting (default: false)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--json]                           Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

### env import-vars

```
Usage: import-vars VARIABLE-NAMES
```

**Description:** Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

**Options:**
```
[--add-export]                     Display sourceable env variables setting (default: false)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### env rm

```
Usage: rm VARIABLE-NAME
```

**Description:** Remove an environment variable from an application

**Options:**
```
[--add-export]                     Display sourceable env variables setting (default: false)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### env set

```
Usage: set VARIABLE-NAME VARIABLE-VALUE
```

**Description:** Add or update an environment variable named <variable-name> with the value <variable-value>

**Options:**
```
[--add-export]                     Display sourceable env variables setting (default: false)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## features

```
Usage: features
```

**Description:** Manage Clever Tools experimental features

### features disable

```
Usage: disable FEATURES
```

**Description:** Disable experimental features

### features enable

```
Usage: enable FEATURES
```

**Description:** Enable experimental features

### features info

```
Usage: info FEATURE
```

**Description:** Display info about an experimental feature

### features list

```
Usage: list
```

**Description:** List available experimental features

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

## hello

```
Usage: hello NAME LAST-NAME
```

**Description:** Say hello to someone

**Options:**
```
[--lang] LANG                      Language for the greeting (en, fr, es) (default: en)
[--upper]                          Print the greeting in uppercase (default: false)
```

## k8s

```
Usage: k8s
```

**Description:** Manage Kubernetes clusters

### k8s add-persistent-storage

```
Usage: add-persistent-storage ID-OR-NAME
```

**Description:** Activate persistent storage to a deployed Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### k8s create

```
Usage: create CLUSTER-NAME
```

**Description:** Create a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--watch, -w]                      Watch the deployment until the cluster is deployed (default: false)
```

### k8s delete

```
Usage: delete ID-OR-NAME
```

**Description:** Delete a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                        Skip confirmation and delete the add-on directly (default: false)
```

### k8s get

```
Usage: get ID-OR-NAME
```

**Description:** Get information about a Kubernetes cluster

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### k8s get-kubeconfig

```
Usage: get-kubeconfig ID-OR-NAME
```

**Description:** Get configuration of a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### k8s list

```
Usage: list
```

**Description:** List Kubernetes clusters

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## keycloak

```
Usage: keycloak
```

**Description:** Manage Clever Cloud Keycloak services

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### keycloak disable-ng

```
Usage: disable-ng ADDON-ID
```

**Description:** Unlink Keycloak from its Network Group

### keycloak enable-ng

```
Usage: enable-ng ADDON-ID
```

**Description:** Link Keycloak to a Network Group, used for multi-instances secure communication

### keycloak get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Keycloak

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### keycloak open

```
Usage: open ADDON-ID
```

**Description:** Open the Keycloak dashboard in Clever Cloud Console

#### keycloak open logs

```
Usage: logs ADDON-ID
```

**Description:** Open the Keycloak application logs in Clever Cloud Console

#### keycloak open webui

```
Usage: webui ADDON-ID
```

**Description:** Open the Keycloak admin console in your browser

### keycloak rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Keycloak

### keycloak restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Keycloak

### keycloak version

```
Usage: version ADDON-ID
```

**Description:** Check Keycloak deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### keycloak version check

```
Usage: check ADDON-ID
```

**Description:** Check Keycloak deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### keycloak version update

```
Usage: update ADDON-ID
```

**Description:** Update Keycloak deployed version

**Options:**
```
[--target] VERSION                 Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## kv

```
Usage: kv KV-ID COMMAND
```

**Description:** Send a raw command to a Materia KV or Redis® add-on

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## link

```
Usage: link APP-ID
```

**Description:** Link this repo to an existing application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## login

```
Usage: login
```

**Description:** Login to Clever Cloud

**Options:**
```
[--secret] SECRET                  Directly give an existing secret
[--token] TOKEN                    Directly give an existing token
```

## logout

```
Usage: logout
```

**Description:** Logout from Clever Cloud

## logs

```
Usage: logs
```

**Description:** Fetch application logs, continuously

**Options:**
```
[--addon] ADDON_ID                 Add-on ID
[--after, --since] AFTER           Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--before, --until] BEFORE         Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--deployment-id] DEPLOYMENT_ID    Fetch logs for a given deployment
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--search] SEARCH                  Fetch logs matching this pattern
```

## make-default

```
Usage: make-default APP-ALIAS
```

**Description:** Make a linked application the default one

## matomo

```
Usage: matomo
```

**Description:** Manage Clever Cloud Matomo services

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### matomo get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Matomo

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### matomo open

```
Usage: open ADDON-ID
```

**Description:** Open the Matomo dashboard in Clever Cloud Console

#### matomo open logs

```
Usage: logs ADDON-ID
```

**Description:** Open the Matomo application logs in Clever Cloud Console

#### matomo open webui

```
Usage: webui ADDON-ID
```

**Description:** Open the Matomo admin console in your browser

### matomo rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Matomo

### matomo restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Matomo

## metabase

```
Usage: metabase
```

**Description:** Manage Clever Cloud Metabase services

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### metabase get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Metabase

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### metabase open

```
Usage: open ADDON-ID
```

**Description:** Open the Metabase dashboard in Clever Cloud Console

#### metabase open logs

```
Usage: logs ADDON-ID
```

**Description:** Open the Metabase application logs in Clever Cloud Console

#### metabase open webui

```
Usage: webui ADDON-ID
```

**Description:** Open the Metabase admin console in your browser

### metabase rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Metabase

### metabase restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Metabase

### metabase version

```
Usage: version ADDON-ID
```

**Description:** Manage Metabase deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### metabase version check

```
Usage: check ADDON-ID
```

**Description:** Check Metabase deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### metabase version update

```
Usage: update ADDON-ID
```

**Description:** Update Metabase deployed version

**Options:**
```
[--target] VERSION                 Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## ng

```
Usage: ng
```

**Description:** List Network Groups

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### ng create

```
Usage: create NG-LABEL
```

**Description:** Create a Network Group

**Options:**
```
[--description] DESCRIPTION        Network Group description
[--link] MEMBERS_IDS               Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--tags] TAGS                      List of tags, separated by a comma
```

#### ng create external

```
Usage: external EXTERNAL-PEER-LABEL PUBLIC-KEY NG-ID-OR-LABEL
```

**Description:** Create an external peer in a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### ng delete

```
Usage: delete NG-ID-OR-LABEL
```

**Description:** Delete a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

#### ng delete external

```
Usage: external EXTERNAL-PEER-ID-OR-LABEL NG-ID-OR-LABEL
```

**Description:** Delete an external peer from a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### ng get

```
Usage: get ID-OR-LABEL
```

**Description:** Get details about a Network Group, a member or a peer

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--type] TYPE                      Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
```

### ng get-config

```
Usage: get-config EXTERNAL-PEER-ID-OR-LABEL NG-ID-OR-LABEL
```

**Description:** Get the WireGuard configuration of a peer in a Network Group

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### ng link

```
Usage: link ID NG-ID-OR-LABEL
```

**Description:** Link a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) to a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### ng search

```
Usage: search ID-OR-LABEL
```

**Description:** Search Network Groups, members or peers and get their details

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--type] TYPE                      Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
```

### ng unlink

```
Usage: unlink ID NG-ID-OR-LABEL
```

**Description:** Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## notify-email

```
Usage: notify-email
```

**Description:** Manage email notifications

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### notify-email add

```
Usage: add NAME
```

**Description:** Add a new email notification

**Options:**
```
[--event] TYPE                     Restrict notifications to specific event types
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--notify] <EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION"Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--service] SERVICE_ID             Restrict notifications to specific applications and add-ons
```

### notify-email remove

```
Usage: remove NOTIFICATION-ID
```

**Description:** Remove an existing email notification

**Options:**
```
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

## open

```
Usage: open
```

**Description:** Open an application in the Console

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## otoroshi

```
Usage: otoroshi
```

**Description:** Manage Clever Cloud Otoroshi services

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### otoroshi disable-ng

```
Usage: disable-ng ADDON-ID
```

**Description:** Unlink Otoroshi from its Network Group

### otoroshi enable-ng

```
Usage: enable-ng ADDON-ID
```

**Description:** Link Otoroshi to a Network Group

### otoroshi get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Otoroshi

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### otoroshi get-config

```
Usage: get-config ADDON-ID
```

**Description:** Get configuration of a deployed Otoroshi in otoroshictl format

### otoroshi open

```
Usage: open ADDON-ID
```

**Description:** Open the Otoroshi dashboard in Clever Cloud Console

#### otoroshi open logs

```
Usage: logs ADDON-ID
```

**Description:** Open the Otoroshi application logs in Clever Cloud Console

#### otoroshi open webui

```
Usage: webui ADDON-ID
```

**Description:** Open the Otoroshi admin console in your browser

### otoroshi rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Otoroshi

### otoroshi restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Otoroshi

### otoroshi version

```
Usage: version ADDON-ID
```

**Description:** Manage Otoroshi deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### otoroshi version check

```
Usage: check ADDON-ID
```

**Description:** Check Otoroshi deployed version

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

#### otoroshi version update

```
Usage: update ADDON-ID
```

**Description:** Update Otoroshi deployed version

**Options:**
```
[--target] VERSION                 Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## profile

```
Usage: profile
```

**Description:** Display the profile of the current user

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### profile open

```
Usage: open
```

**Description:** Open your profile in the Console

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

## published-config

```
Usage: published-config
```

**Description:** Manage the configuration made available to other applications by this application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### published-config import

```
Usage: import
```

**Description:** Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--json]                           Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

### published-config rm

```
Usage: rm VARIABLE-NAME
```

**Description:** Remove a published configuration variable from an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

### published-config set

```
Usage: set VARIABLE-NAME VARIABLE-VALUE
```

**Description:** Add or update a published configuration item named <variable-name> with the value <variable-value>

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## restart

```
Usage: restart
```

**Description:** Start or restart an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--commit] COMMIT ID               Restart the application with a specific commit ID
[--exit-on, -e] STEP               Step at which the logs streaming is ended, steps are: ${...} (default: deploy-end)
[--follow]                         Continue to follow logs after deployment has ended (default: false)
[--quiet, -q]                      Don't show logs during deployment (default: false)
[--without-cache]                  Restart the application without using cache (default: false)
```

## scale

```
Usage: scale
```

**Description:** Change scalability of an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--build-flavor] BUILDFLAVOR       The size of the build instance, or 'disabled' if you want to disable dedicated build instances
[--flavor] FLAVOR                  The instance size of your application
[--instances] INSTANCES            The number of parallel instances
[--max-flavor] MAXFLAVOR           The maximum instance size of your application
[--max-instances] MAXINSTANCES     The maximum number of parallel instances
[--min-flavor] MINFLAVOR           The minimum scale size of your application
[--min-instances] MININSTANCES     The minimum number of parallel instances
```

## service

```
Usage: service
```

**Description:** Manage service dependencies

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--only-addons]                    Only show add-on dependencies (default: false)
[--only-apps]                      Only show app dependencies (default: false)
[--show-all]                       Show all available add-ons and applications (default: false)
```

### service link-addon

```
Usage: link-addon ADDON-ID
```

**Description:** Link an existing add-on to this application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--only-addons]                    Only show add-on dependencies (default: false)
[--only-apps]                      Only show app dependencies (default: false)
[--show-all]                       Show all available add-ons and applications (default: false)
```

### service link-app

```
Usage: link-app APP-ID
```

**Description:** Add an existing app as a dependency

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--only-addons]                    Only show add-on dependencies (default: false)
[--only-apps]                      Only show app dependencies (default: false)
[--show-all]                       Show all available add-ons and applications (default: false)
```

### service unlink-addon

```
Usage: unlink-addon ADDON-ID
```

**Description:** Unlink an add-on from this application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--only-addons]                    Only show add-on dependencies (default: false)
[--only-apps]                      Only show app dependencies (default: false)
[--show-all]                       Show all available add-ons and applications (default: false)
```

### service unlink-app

```
Usage: unlink-app APP-ID
```

**Description:** Remove an app from the dependencies

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--only-addons]                    Only show add-on dependencies (default: false)
[--only-apps]                      Only show app dependencies (default: false)
[--show-all]                       Show all available add-ons and applications (default: false)
```

## ssh

```
Usage: ssh
```

**Description:** Connect to running instances through SSH

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--identity-file, -i] IDENTITY-FILESSH identity file
```

## ssh-keys

```
Usage: ssh-keys
```

**Description:** Manage SSH keys of the current user

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### ssh-keys add

```
Usage: add SSH-KEY-PATH SSH-KEY-NAME
```

**Description:** Add a new SSH key to the current user

### ssh-keys open

```
Usage: open
```

**Description:** Open the SSH keys management page in the Console

### ssh-keys remove

```
Usage: remove SSH-KEY-NAME
```

**Description:** Remove a SSH key from the current user

### ssh-keys remove-all

```
Usage: remove-all
```

**Description:** Remove all SSH keys from the current user

**Options:**
```
[--yes, -y]                        Skip confirmation and remove all SSH keys directly (default: false)
```

## status

```
Usage: status
```

**Description:** See the status of an application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

## stop

```
Usage: stop
```

**Description:** Stop a running application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
```

## tcp-redirs

```
Usage: tcp-redirs
```

**Description:** Control the TCP redirections from reverse proxies to your application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### tcp-redirs add

```
Usage: add
```

**Description:** Add a new TCP redirection to the application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--namespace] NAMESPACE            Namespace in which the TCP redirection should be
```

### tcp-redirs list-namespaces

```
Usage: list-namespaces
```

**Description:** List the namespaces in which you can create new TCP redirections

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### tcp-redirs remove

```
Usage: remove PORT
```

**Description:** Remove a TCP redirection from the application

**Options:**
```
[--alias, -a] ALIAS                Short name for the application
[--app] ID_OR_NAME                 Application to manage by its ID (or name, if unambiguous)
[--namespace] NAMESPACE            Namespace in which the TCP redirection should be
```

## tokens

```
Usage: tokens
```

**Description:** Manage API tokens to query Clever Cloud API from ${...}

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### tokens create

```
Usage: create API-TOKEN-NAME
```

**Description:** Create an API token

**Options:**
```
[--expiration, -e] EXPIRATION      Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y
[--format, -F] FORMAT              Output format (${...}) (default: human)
```

### tokens revoke

```
Usage: revoke API-TOKEN-ID
```

**Description:** Revoke an API token

## unlink

```
Usage: unlink APP-ALIAS
```

**Description:** Unlink this repo from an existing application

## version

```
Usage: version
```

**Description:** Display the clever-tools version

## webhooks

```
Usage: webhooks
```

**Description:** Manage webhooks

**Options:**
```
[--format, -F] FORMAT              Output format (${...}) (default: human)
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```

### webhooks add

```
Usage: add URL NAME
```

**Description:** Register webhook to be called when events happen

**Options:**
```
[--event] TYPE                     Restrict notifications to specific event types
[--format] FORMAT                  Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: raw)
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
[--service] SERVICE_ID             Restrict notifications to specific applications and add-ons
```

### webhooks remove

```
Usage: remove NOTIFICATION-ID
```

**Description:** Remove an existing webhook

**Options:**
```
[--list-all]                       List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] ID_OR_NAME    Organisation to target by its ID (or name, if unambiguous)
```


## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: https://www.clever-cloud.com/developers/doc/
Clever Cloud complete documentation is available in a LLM-optimized format: https://www.clever-cloud.com/developers/llms.txt
