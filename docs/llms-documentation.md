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
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `ldn`, `sgp`, `grahds`, `wsw`, `mtl`, `syd`

- `mongodb-addon`:
  - plans: `xl_big`, `xs_med`, `m_big`, `xxl_sml`, `xl_sml`, `s_sml`, `m_sml`, `xxl_med`, `m_med`, `dev`, `s_med`, `xs_sml`, `xl_med`, `l_sml`, `s_hug`, `xs_big`, `m_hug`, `xxl_big`, `l_big`, `l_med`, `s_big`
  - zones: `par`, `rbx`, `scw`, `ldn`, `sgp`, `wsw`, `mtl`, `syd`

- `config-provider`:
  - plans: `std`
  - zones: `par`

- `otoroshi`:
  - plans: `base`
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `sgp`, `fr-north-hds`, `grahds`, `wsw`, `mtl`, `syd`

- `kv`:
  - plans: `base`
  - zones: `par`

- `addon-matomo`:
  - plans: `beta`
  - zones: `par`, `rbx`, `scw`, `sgp`, `wsw`, `mtl`, `syd`

- `postgresql-addon`:
  - plans: `xs_sml`, `xxs_sml`, `xl_hug`, `xl_sml`, `xs_big`, `3xl_cpu_tit`, `xs_tny`, `xxl_sml`, `xxs_med`, `l_big`, `m_sml`, `l_sml`, `xxxl_sml`, `m_big`, `s_hug`, `xxxl_big`, `xxxl_med`, `l_gnt`, `s_sml`, `xxl_hug`, `xxl_med`, `s_med`, `m_med`, `xxl_big`, `xxs_big`, `l_med`, `xl_med`, `xl_gnt`, `s_big`, `dev`, `xl_big`, `xs_med`
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `ldn`, `sgp`, `grahds`, `wsw`, `mtl`, `syd`

- `azimutt`:
  - plans: `team-3`, `team-5`, `solo`, `team-4`, `team-2`, `free`, `team`, `enterprise`
  - zones: `par`

- `mailpace`:
  - plans: `clever_solo`, `clever_scaling_10`, `clever_scaling_50`, `clever_scaling_70`, `clever_scaling_20`, `clever_scaling_30`, `clever_scaling_100`, `clever_scaling_40`
  - zones: `par`

- `keycloak`:
  - plans: `base`
  - zones: `par`, `rbx`, `scw`, `sgp`, `wsw`, `mtl`, `syd`

- `jenkins`:
  - plans: `M`, `XS`, `L`, `XL`, `S`
  - zones: `par`, `rbxhds`, `scw`, `ldn`, `grahds`

- `cellar-addon`:
  - plans: `S`
  - zones: `par`, `rbxhds`, `fr-north-hds`

- `fs-bucket`:
  - plans: `s`
  - zones: `par`, `rbx`, `scw`, `ldn`, `sgp`, `wsw`, `mtl`, `syd`

- `addon-pulsar`:
  - plans: `beta`
  - zones: `par`

- `metabase`:
  - plans: `base`
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `sgp`, `fr-north-hds`, `grahds`, `wsw`, `mtl`, `syd`

- `es-addon`:
  - plans: `xs`, `xl`, `l`, `4xl`, `xxxl`, `xxl`, `s`, `5xl`, `m`
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `ldn`, `sgp`, `grahds`, `wsw`, `mtl`, `syd`

- `redis-addon`:
  - plans: `m_mono`, `xxxxl_mono`, `s_mono`, `l_mono`, `xxxl_mono`, `xl_mono`, `xxl_mono`
  - zones: `par`, `rbx`, `rbxhds`, `scw`, `ldn`, `sgp`, `grahds`, `wsw`, `mtl`, `syd`

Default deployment zone is `par`, default plan is the lowest available.

# How to use Clever Tools, CLI reference

```
Usage: clever 
```

**Description:** CLI tool to manage Clever Cloud's data and products

**Options:**
```
[--help, -?]            Display help about this program (default: false)
[--version, -V]         Display the version of this program (default: false)
[--color]               Choose whether to print colors or not. You can also use --no-color (default: true)
[--update-notifier]     Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
[--verbose, -v]         Verbose output (default: false)
```

**Note:** The options listed above (`--help`, `--version`, `--color`, `--update-notifier`, `--verbose`) are available for all Clever Tools commands and sub-commands
## accesslogs

```
Usage: accesslogs 
```

**Description:** Fetch access logs

**Options:**
```
[--alias, -a] ALIAS            Short name for the application
[--app] ID_OR_NAME             Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT          Output format (human, json, json-stream) (default: human)
[--before, --until] BEFORE     Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER       Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--addon] ADDON_ID             Add-on ID
```

## activity

```
Usage: activity 
```

**Description:** Show last deployments of an application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--follow, -f]            Track new deployments in activity list (default: false)
[--show-all]              Show all activity (default: false)
[--format, -F] FORMAT     Output format (human, json, json-stream) (default: human)
```

## addon

```
Usage: addon 
```

**Description:** Manage add-ons

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### addon create

```
Usage: create ADDON-PROVIDER ADDON-NAME
```

**Description:** Create an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--link, -l] ALIAS                  Link the created add-on to the app with the specified alias
[--yes, -y]                         Skip confirmation even if the add-on is not free (default: false)
[--plan, -p] PLAN                   Add-on plan, depends on the provider (default: )
[--region, -r] REGION               Region to provision the add-on in, depends on the provider (default: par)
[--addon-version] ADDON-VERSION     The version to use for the add-on
[--option] OPTION                   Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### addon delete

```
Usage: delete ADDON-ID
```

**Description:** Delete an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                         Skip confirmation and delete the add-on directly (default: false)
```

### addon rename

```
Usage: rename ADDON-ID ADDON-NAME
```

**Description:** Rename an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### addon list

```
Usage: list 
```

**Description:** List available add-ons

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### addon providers

```
Usage: providers 
```

**Description:** List available add-on providers

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

#### addon providers show

```
Usage: show ADDON-PROVIDER
```

**Description:** Show information about an add-on provider

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### addon env

```
Usage: env ADDON
```

**Description:** List environment variables for an add-on

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json, shell) (default: human)
```

## applications

```
Usage: applications 
```

**Description:** List linked applications

**Options:**
```
[--only-aliases]        List only application aliases (default: false)
[--json, -j]            Show result in JSON format (default: false)
```

### applications list

```
Usage: list 
```

**Description:** List all applications

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

## cancel-deploy

```
Usage: cancel-deploy 
```

**Description:** Cancel an ongoing deployment

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

## config

```
Usage: config 
```

**Description:** Display or edit the configuration of your application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### config get

```
Usage: get CONFIGURATION-NAME
```

**Description:** Display the current configuration

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### config set

```
Usage: set CONFIGURATION-NAME CONFIGURATION-VALUE
```

**Description:** Edit one configuration setting

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### config update

```
Usage: update 
```

**Description:** Edit multiple configuration settings at once

**Options:**
```
[--alias, -a] ALIAS             Short name for the application
[--app] ID_OR_NAME              Application to manage by its ID (or name, if unambiguous)
[--name]                        Set name
[--description]                 Set description
[--enable-zero-downtime]        Enable zero-downtime (default: false)
[--disable-zero-downtime]       Disable zero-downtime (default: false)
[--enable-sticky-sessions]      Enable sticky-sessions (default: false)
[--disable-sticky-sessions]     Disable sticky-sessions (default: false)
[--enable-cancel-on-push]       Enable cancel-on-push (default: false)
[--disable-cancel-on-push]      Disable cancel-on-push (default: false)
[--enable-force-https]          Enable force-https (default: false)
[--disable-force-https]         Disable force-https (default: false)
[--enable-task]                 Enable task (default: false)
[--disable-task]                Disable task (default: false)
```

## console

```
Usage: console 
```

**Description:** Open an application in the Console

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

## create

```
Usage: create --type TYPE [APP-NAME]
```

**Description:** Create an application

**Options:**
```
--type, -t TYPE                     Instance type
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--alias, -a] ALIAS                 Short name for the application
[--region, -r] ZONE                 Region, can be 'par', 'parhds', 'grahds', 'rbx', 'rbxhds', 'scw', 'ldn', 'mtl', 'sgp', 'syd', 'wsw' (default: par)
[--github] OWNER/REPO               GitHub application to use for deployments
[--task, -T] COMMAND                The application launch as a task executing the given command, then stopped
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

## curl

```
Usage: clever curl
```

**Description:** Query Clever Cloud's API using Clever Tools credentials. For example:

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
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

#### database backups download

```
Usage: download DATABASE-ID BACKUP-ID
```

**Description:** Download a database backup

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
[--output, --out]                   Redirect the output of the command in a file
```

## delete

```
Usage: delete 
```

**Description:** Delete an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--yes, -y]             Skip confirmation and delete the application directly (default: false)
```

## deploy

```
Usage: deploy 
```

**Description:** Deploy an application

**Options:**
```
[--alias, -a] ALIAS                   Short name for the application
[--branch, -b] BRANCH                 Branch to push (current branch by default) (default: )
[--tag, -t] TAG                       Tag to push (none by default) (default: )
[--quiet, -q]                         Don't show logs during deployment (default: false)
[--force, -f]                         Force deploy even if it's not fast-forwardable (default: false)
[--follow]                            Continue to follow logs after deployment has ended (default: false)
[--same-commit-policy, -p] POLICY     What to do when local and remote commit are identical (error, ignore, restart, rebuild) (default: error)
[--exit-on, -e] STEP                  Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
```

## diag

```
Usage: diag 
```

**Description:** Diagnose the current installation (prints various informations for support)

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

## domain

```
Usage: domain 
```

**Description:** Manage domain names for an application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### domain add

```
Usage: add FQDN
```

**Description:** Add a domain name to an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### domain favourite

```
Usage: favourite 
```

**Description:** Manage the favourite domain name for an application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### domain favourite set

```
Usage: set FQDN
```

**Description:** Set the favourite domain for an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

#### domain favourite unset

```
Usage: unset 
```

**Description:** Unset the favourite domain for an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### domain rm

```
Usage: rm FQDN
```

**Description:** Remove a domain name from an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### domain diag

```
Usage: diag 
```

**Description:** Check if domains associated to a specific app are properly configured

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
[--filter] TEXT           Check only domains containing the provided text (default: )
```

### domain overview

```
Usage: overview 
```

**Description:** Get an overview of all your domains (all orgas, all apps)

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
[--filter] TEXT           Get only domains containing the provided text (default: )
```

## drain

```
Usage: drain 
```

**Description:** Manage drains

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### drain create

```
Usage: create DRAIN-TYPE DRAIN-URL
```

**Description:** Create a drain

**Options:**
```
[--alias, -a] ALIAS                   Short name for the application
[--app] ID_OR_NAME                    Application to manage by its ID (or name, if unambiguous)
[--username, -u] USERNAME             Basic auth username (for elasticsearch or raw-http)
[--password, -p] PASSWORD             Basic auth password (for elasticsearch or raw-http)
[--api-key, -k] API_KEY               API key (for newrelic)
[--index-prefix, -i] INDEX_PREFIX     Optional index prefix (for elasticsearch), `logstash` value is used if not set
[--sd-params, -s] SD_PARAMS           RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`
```

### drain get

```
Usage: get DRAIN-ID
```

**Description:** Get drain info

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### drain remove

```
Usage: remove DRAIN-ID
```

**Description:** Remove a drain

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### drain enable

```
Usage: enable DRAIN-ID
```

**Description:** Enable a drain

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### drain disable

```
Usage: disable DRAIN-ID
```

**Description:** Disable a drain

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

## emails

```
Usage: emails 
```

**Description:** Manage email addresses of the current user

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### emails add

```
Usage: add EMAIL
```

**Description:** Add a new secondary email address to the current user

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
[--yes, -y]             Skip confirmation (default: false)
```

### emails open

```
Usage: open 
```

**Description:** Open the email addresses management page in the Console

## env

```
Usage: env 
```

**Description:** Manage environment variables of an application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--add-export]            Display sourceable env variables setting (default: false)
[--format, -F] FORMAT     Output format (human, json, shell) (default: human)
```

### env set

```
Usage: set VARIABLE-NAME VARIABLE-VALUE
```

**Description:** Add or update an environment variable named <variable-name> with the value <variable-value>

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--add-export]          Display sourceable env variables setting (default: false)
```

### env rm

```
Usage: rm VARIABLE-NAME
```

**Description:** Remove an environment variable from an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--add-export]          Display sourceable env variables setting (default: false)
```

### env import

```
Usage: import 
```

**Description:** Load environment variables from STDIN

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--add-export]          Display sourceable env variables setting (default: false)
[--json]                Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

### env import-vars

```
Usage: import-vars VARIABLE-NAMES
```

**Description:** Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--add-export]          Display sourceable env variables setting (default: false)
```

## features

```
Usage: features 
```

**Description:** Manage Clever Tools experimental features

### features enable

```
Usage: enable FEATURES
```

**Description:** Enable experimental features

### features disable

```
Usage: disable FEATURES
```

**Description:** Disable experimental features

### features list

```
Usage: list 
```

**Description:** List available experimental features

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### features info

```
Usage: info FEATURE
```

**Description:** Display info about an experimental feature

## help

```
Usage: help 
```

**Description:** Display help about the Clever Cloud CLI

## k8s

```
Usage: k8s 
```

**Description:** Manage Kubernetes clusters [BETA]

### k8s list

```
Usage: list 
```

**Description:** List Kubernetes clusters

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### k8s create

```
Usage: create CLUSTER-NAME
```

**Description:** Create a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--watch, -w]                       Watch the deployment until the cluster is deployed (default: false)
```

### k8s add-persistent-storage

```
Usage: add-persistent-storage ID-OR-NAME
```

**Description:** Activate persistent storage to a deployed Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### k8s delete

```
Usage: delete ID-OR-NAME
```

**Description:** Delete a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                         Skip confirmation and delete the add-on directly (default: false)
```

### k8s get

```
Usage: get ID-OR-NAME
```

**Description:** Get information about a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### k8s get-kubeconfig

```
Usage: get-kubeconfig ID-OR-NAME
```

**Description:** Get configuration of a Kubernetes cluster

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

## keycloak

```
Usage: keycloak 
```

**Description:** Manage Clever Cloud Keycloak services [BETA]

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### keycloak get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Keycloak

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### keycloak enable-ng

```
Usage: enable-ng ADDON-ID
```

**Description:** Link Keycloak to a Network Group, used for multi-instances secure communication

### keycloak disable-ng

```
Usage: disable-ng ADDON-ID
```

**Description:** Unlink Keycloak from its Network Group

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

### keycloak restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Keycloak

### keycloak rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Keycloak

### keycloak version

```
Usage: version ADDON-ID
```

**Description:** Check Keycloak deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### keycloak version check

```
Usage: check ADDON-ID
```

**Description:** Check Keycloak deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### keycloak version update

```
Usage: update ADDON-ID
```

**Description:** Update Keycloak deployed version

**Options:**
```
[--target] VERSION      Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## kv

```
Usage: kv KV-ID COMMAND
```

**Description:** Send a raw command to a Materia KV or Redis® add-on [BETA]

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

## link

```
Usage: link APP-ID
```

**Description:** Link this repo to an existing application

**Options:**
```
[--alias, -a] ALIAS                 Short name for the application
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

## login

```
Usage: login 
```

**Description:** Login to Clever Cloud

**Options:**
```
[--token] TOKEN         Directly give an existing token
[--secret] SECRET       Directly give an existing secret
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
[--alias, -a] ALIAS                 Short name for the application
[--app] ID_OR_NAME                  Application to manage by its ID (or name, if unambiguous)
[--before, --until] BEFORE          Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER            Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--search] SEARCH                   Fetch logs matching this pattern
[--deployment-id] DEPLOYMENT_ID     Fetch logs for a given deployment
[--addon] ADDON_ID                  Add-on ID
[--format, -F] FORMAT               Output format (human, json, json-stream) (default: human)
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

**Description:** Manage Clever Cloud Matomo services [BETA]

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### matomo get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Matomo

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
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

### matomo restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Matomo

### matomo rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Matomo

## metabase

```
Usage: metabase 
```

**Description:** Manage Clever Cloud Metabase services [BETA]

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### metabase get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Metabase

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
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

### metabase restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Metabase

### metabase rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Metabase

### metabase version

```
Usage: version ADDON-ID
```

**Description:** Manage Metabase deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### metabase version check

```
Usage: check ADDON-ID
```

**Description:** Check Metabase deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### metabase version update

```
Usage: update ADDON-ID
```

**Description:** Update Metabase deployed version

**Options:**
```
[--target] VERSION      Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## ng

```
Usage: ng 
```

**Description:** List Network Groups [BETA]

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### ng create

```
Usage: create NG-LABEL
```

**Description:** Create a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--link] MEMBERS_IDS                Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)
[--description] DESCRIPTION         Network Group description
[--tags] TAGS                       List of tags, separated by a comma
```

#### ng create external

```
Usage: external EXTERNAL-PEER-LABEL NG-ID-OR-LABEL PUBLIC-KEY
```

**Description:** Create an external peer in a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### ng delete

```
Usage: delete NG-ID-OR-LABEL
```

**Description:** Delete a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

#### ng delete external

```
Usage: external EXTERNAL-PEER-ID-OR-LABEL NG-ID-OR-LABEL
```

**Description:** Delete an external peer from a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### ng link

```
Usage: link ID NG-ID-OR-LABEL
```

**Description:** Link a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) to a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### ng unlink

```
Usage: unlink ID NG-ID-OR-LABEL
```

**Description:** Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
```

### ng get

```
Usage: get ID-OR-LABEL
```

**Description:** Get details about a Network Group, a member or a peer

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--type] TYPE                       Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### ng get-config

```
Usage: get-config EXTERNAL-PEER-ID-OR-LABEL NG-ID-OR-LABEL
```

**Description:** Get the WireGuard configuration of a peer in a Network Group

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### ng search

```
Usage: search ID-OR-LABEL
```

**Description:** Search Network Groups, members or peers and get their details

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--type] TYPE                       Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

## notify-email

```
Usage: notify-email 
```

**Description:** Manage email notifications

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--list-all]                        List all notifications for your user or for an organisation with the '--org' option (default: false)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### notify-email add

```
Usage: add --notify <EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION" NAME
```

**Description:** Add a new email notification

**Options:**
```
[--org, -o, --owner] ID_OR_NAME                       Organisation to target by its ID (or name, if unambiguous)
[--list-all]                                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--event] TYPE                                        Restrict notifications to specific event types
[--service] SERVICE_ID                                Restrict notifications to specific applications and add-ons
--notify <EMAIL_ADDRESS>|<USER_ID>|"ORGANISATION"     Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)
```

### notify-email remove

```
Usage: remove NOTIFICATION-ID
```

**Description:** Remove an existing email notification

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--list-all]                        List all notifications for your user or for an organisation with the '--org' option (default: false)
```

## open

```
Usage: open 
```

**Description:** Open an application in the Console

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

## otoroshi

```
Usage: otoroshi 
```

**Description:** Manage Clever Cloud Otoroshi services [BETA]

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### otoroshi get

```
Usage: get ADDON-ID
```

**Description:** Get information about a deployed Otoroshi

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### otoroshi get-config

```
Usage: get-config ADDON-ID
```

**Description:** Get configuration of a deployed Otoroshi in otoroshictl format

### otoroshi enable-ng

```
Usage: enable-ng ADDON-ID
```

**Description:** Link Otoroshi to a Network Group

### otoroshi disable-ng

```
Usage: disable-ng ADDON-ID
```

**Description:** Unlink Otoroshi from its Network Group

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

### otoroshi restart

```
Usage: restart ADDON-ID
```

**Description:** Restart Otoroshi

### otoroshi rebuild

```
Usage: rebuild ADDON-ID
```

**Description:** Rebuild Otoroshi

### otoroshi version

```
Usage: version ADDON-ID
```

**Description:** Manage Otoroshi deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### otoroshi version check

```
Usage: check ADDON-ID
```

**Description:** Check Otoroshi deployed version

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

#### otoroshi version update

```
Usage: update ADDON-ID
```

**Description:** Update Otoroshi deployed version

**Options:**
```
[--target] VERSION      Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)
```

## profile

```
Usage: profile 
```

**Description:** Display the profile of the current user

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### profile open

```
Usage: open 
```

**Description:** Open your profile in the Console

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

## published-config

```
Usage: published-config 
```

**Description:** Manage the configuration made available to other applications by this application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json, shell) (default: human)
```

### published-config set

```
Usage: set VARIABLE-NAME VARIABLE-VALUE
```

**Description:** Add or update a published configuration item named <variable-name> with the value <variable-value>

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### published-config rm

```
Usage: rm VARIABLE-NAME
```

**Description:** Remove a published configuration variable from an application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

### published-config import

```
Usage: import 
```

**Description:** Load published configuration from STDIN

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--json]                Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

## restart

```
Usage: restart 
```

**Description:** Start or restart an application

**Options:**
```
[--alias, -a] ALIAS      Short name for the application
[--app] ID_OR_NAME       Application to manage by its ID (or name, if unambiguous)
[--commit] COMMIT ID     Restart the application with a specific commit ID
[--without-cache]        Restart the application without using cache (default: false)
[--quiet, -q]            Don't show logs during deployment (default: false)
[--follow]               Continue to follow logs after deployment has ended (default: false)
[--exit-on, -e] STEP     Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
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
[--flavor] FLAVOR                  The instance size of your application
[--min-flavor] MINFLAVOR           The minimum scale size of your application
[--max-flavor] MAXFLAVOR           The maximum instance size of your application
[--instances] INSTANCES            The number of parallel instances
[--min-instances] MININSTANCES     The minimum number of parallel instances
[--max-instances] MAXINSTANCES     The maximum number of parallel instances
[--build-flavor] BUILDFLAVOR       The size of the build instance, or 'disabled' if you want to disable dedicated build instances
```

## service

```
Usage: service 
```

**Description:** Manage service dependencies

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--only-apps]             Only show app dependencies (default: false)
[--only-addons]           Only show add-on dependencies (default: false)
[--show-all]              Show all available add-ons and applications (default: false)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### service link-app

```
Usage: link-app APP-ID
```

**Description:** Add an existing app as a dependency

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--only-apps]           Only show app dependencies (default: false)
[--only-addons]         Only show add-on dependencies (default: false)
[--show-all]            Show all available add-ons and applications (default: false)
```

### service unlink-app

```
Usage: unlink-app APP-ID
```

**Description:** Remove an app from the dependencies

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--only-apps]           Only show app dependencies (default: false)
[--only-addons]         Only show add-on dependencies (default: false)
[--show-all]            Show all available add-ons and applications (default: false)
```

### service link-addon

```
Usage: link-addon ADDON-ID
```

**Description:** Link an existing add-on to this application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--only-apps]           Only show app dependencies (default: false)
[--only-addons]         Only show add-on dependencies (default: false)
[--show-all]            Show all available add-ons and applications (default: false)
```

### service unlink-addon

```
Usage: unlink-addon ADDON-ID
```

**Description:** Unlink an add-on from this application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
[--only-apps]           Only show app dependencies (default: false)
[--only-addons]         Only show add-on dependencies (default: false)
[--show-all]            Show all available add-ons and applications (default: false)
```

## ssh

```
Usage: ssh 
```

**Description:** Connect to running instances through SSH

**Options:**
```
[--alias, -a] ALIAS                     Short name for the application
[--app] ID_OR_NAME                      Application to manage by its ID (or name, if unambiguous)
[--identity-file, -i] IDENTITY-FILE     SSH identity file
```

## ssh-keys

```
Usage: ssh-keys 
```

**Description:** Manage SSH keys of the current user

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### ssh-keys add

```
Usage: add SSH-KEY-NAME SSH-KEY-PATH
```

**Description:** Add a new SSH key to the current user

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
[--yes, -y]             Skip confirmation and remove all SSH keys directly (default: false)
```

### ssh-keys open

```
Usage: open 
```

**Description:** Open the SSH keys management page in the Console

## status

```
Usage: status 
```

**Description:** See the status of an application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

## stop

```
Usage: stop 
```

**Description:** Stop a running application

**Options:**
```
[--alias, -a] ALIAS     Short name for the application
[--app] ID_OR_NAME      Application to manage by its ID (or name, if unambiguous)
```

## tcp-redirs

```
Usage: tcp-redirs 
```

**Description:** Control the TCP redirections from reverse proxies to your application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### tcp-redirs list-namespaces

```
Usage: list-namespaces 
```

**Description:** List the namespaces in which you can create new TCP redirections

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### tcp-redirs add

```
Usage: add --namespace NAMESPACE 
```

**Description:** Add a new TCP redirection to the application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
--namespace NAMESPACE     Namespace in which the TCP redirection should be
```

### tcp-redirs remove

```
Usage: remove --namespace NAMESPACE PORT
```

**Description:** Remove a TCP redirection from the application

**Options:**
```
[--alias, -a] ALIAS       Short name for the application
[--app] ID_OR_NAME        Application to manage by its ID (or name, if unambiguous)
--namespace NAMESPACE     Namespace in which the TCP redirection should be
```

## tokens

```
Usage: tokens 
```

**Description:** Manage API tokens to query Clever Cloud API from https://api-bridge.clever-cloud.com

**Options:**
```
[--format, -F] FORMAT     Output format (human, json) (default: human)
```

### tokens create

```
Usage: create API-TOKEN-NAME
```

**Description:** Create an API token

**Options:**
```
[--expiration, -e] EXPIRATION     Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y
[--format, -F] FORMAT             Output format (human, json) (default: human)
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
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--list-all]                        List all notifications for your user or for an organisation with the '--org' option (default: false)
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

### webhooks add

```
Usage: add NAME URL
```

**Description:** Register webhook to be called when events happen

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--list-all]                        List all notifications for your user or for an organisation with the '--org' option (default: false)
[--format] FORMAT                   Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: raw)
[--event] TYPE                      Restrict notifications to specific event types
[--service] SERVICE_ID              Restrict notifications to specific applications and add-ons
```

### webhooks remove

```
Usage: remove NOTIFICATION-ID
```

**Description:** Remove an existing webhook

**Options:**
```
[--org, -o, --owner] ID_OR_NAME     Organisation to target by its ID (or name, if unambiguous)
[--list-all]                        List all notifications for your user or for an organisation with the '--org' option (default: false)
```

## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: https://www.clever-cloud.com/developers/doc/
Clever Cloud complete documentation is available in a LLM-optimized format: https://www.clever-cloud.com/developers/llms.txt
