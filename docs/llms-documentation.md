This document is automatically generated from Clever Tools `4.4.1` and Clever Cloud API. It covers all Clever Tools commands and options. Use it to better understand this CLI and its capabilities or to train/use LLMs, AI-assisted IDEs.

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

Flavor `pico` is not available for: `docker`, `frankenphp`, `php`, `static-apache`

Applications deployment zones (region): `par`, `parhds`, `fr-north-hds`, `grahds`, `ldn`, `mtl`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

## Add-on providers, plans and zones (region)

- `addon-matomo`:
  - plans: `beta`
  - zones: `par`, `mtl`, `nqz`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `addon-pulsar`:
  - plans: `beta`
  - zones: `par`, `parhds`

- `azimutt`:
  - plans: `free`, `solo`, `team`, `team-2`, `team-3`, `team-4`, `team-5`, `enterprise`
  - zones: `par`, `nqz`

- `cellar-addon`:
  - plans: `S`
  - zones: `par`, `parhds`, `fr-north-hds`, `nqz`, `numspot`, `rbxhds`

- `config-provider`:
  - plans: `std`
  - zones: `par`, `parhds`, `nqz`

- `es-addon`:
  - plans: `xs`, `s`, `m`, `l`, `xl`, `xxl`, `xxxl`, `4xl`, `5xl`
  - zones: `par`, `parhds`, `gov`, `grahds`, `ldn`, `lux`, `mea`, `mtl`, `nqz`, `numspot`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `fs-bucket`:
  - plans: `s`
  - zones: `par`, `faumepar`, `gov`, `ldn`, `lux`, `mea`, `mtl`, `nqz`, `numspot`, `rbx`, `scw`, `sgp`, `syd`, `utocat`, `wiseband`, `wsw`

- `jenkins`:
  - plans: `XS`, `S`, `M`, `L`, `XL`
  - zones: `par`, `gov`, `grahds`, `ldn`, `lux`, `mea`, `nqz`, `numspot`, `rbxhds`, `scw`

- `keycloak`:
  - plans: `base`
  - zones: `par`, `mtl`, `nqz`, `rbx`, `scw`, `sgp`, `syd`, `wsw`

- `kv`:
  - plans: `base`
  - zones: `par`

- `mailpace`:
  - plans: `clever_solo`, `clever_scaling_10`, `clever_scaling_20`, `clever_scaling_30`, `clever_scaling_40`, `clever_scaling_50`, `clever_scaling_70`, `clever_scaling_100`
  - zones: `par`, `nqz`

- `metabase`:
  - plans: `base`
  - zones: `par`, `fr-north-hds`, `grahds`, `mtl`, `nqz`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `mongodb-addon`:
  - plans: `xs_sml`, `xs_med`, `xs_big`, `s_sml`, `s_med`, `s_big`, `s_hug`, `m_sml`, `m_med`, `m_big`, `m_hug`, `l_sml`, `l_med`, `l_big`, `xl_sml`, `xl_med`, `xl_big`, `xxl_sml`, `xxl_med`, `xxl_big`
  - zones: `par`, `gov`, `ihc`, `ldn`, `ledgy`, `lux`, `mea`, `mtl`, `nqz`, `numspot`, `rbx`, `scw`, `sgp`, `syd`, `wsw`, `yaakadev`

- `mysql-addon`:
  - plans: `dev`, `xxs_sml`, `xxs_med`, `xxs_big`, `xs_tny`, `xs_sml`, `xs_med`, `xs_big`, `s_sml`, `s_med`, `s_big`, `m_sml`, `m_med`, `m_big`, `l_sml`, `l_med`, `l_big`, `xl_sml`, `xl_med`, `xl_big`, `xxl_sml`, `xxl_med`, `xxl_big`, `xxl_hug`
  - zones: `par`, `parhds`, `faumepar`, `gov`, `grahds`, `intuiti`, `ldn`, `lux`, `maj-digital`, `mea`, `mtl`, `nqz`, `numspot`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `otoroshi`:
  - plans: `base`
  - zones: `par`, `fr-north-hds`, `grahds`, `mtl`, `nqz`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `postgresql-addon`:
  - plans: `dev`, `xxs_sml`, `xxs_med`, `xxs_big`, `xs_tny`, `xs_sml`, `xs_med`, `xs_big`, `s_sml`, `s_med`, `s_big`, `s_hug`, `m_sml`, `m_med`, `m_big`, `l_sml`, `l_med`, `l_big`, `xl_sml`, `l_gnt`, `xl_med`, `xl_big`, `xl_hug`, `xl_gnt`, `xxl_sml`, `xxl_med`, `xxl_big`, `xxl_hug`, `xxxl_sml`, `xxxl_med`, `xxxl_big`, `3xl_cpu_tit`
  - zones: `par`, `parhds`, `boxraiser`, `clevercloud-postgresql-internal`, `gov`, `grahds`, `graviteesource`, `ldn`, `lux`, `mea`, `mtl`, `navalgroup`, `navalgroupblue`, `nqz`, `numspot`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

- `redis-addon`:
  - plans: `s_mono`, `m_mono`, `l_mono`, `xl_mono`, `xxl_mono`, `xxxl_mono`, `xxxxl_mono`
  - zones: `par`, `parhds`, `gov`, `grahds`, `ldn`, `lux`, `mea`, `mtl`, `nqz`, `numspot`, `rbx`, `rbxhds`, `scw`, `sgp`, `syd`, `wsw`

Default deployment zone is `par`, default plan is the lowest available.

## accesslogs

Description:** Fetch access logs

**Usage**
clever accesslogs [options]

**Options**
    --addon <addon-id>            Add-on ID
    --after, --since <after>      Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
-a, --alias <alias>               Short name for the application
    --app <app-id|app-name>       Application to manage by its ID (or name, if unambiguous)
    --before, --until <before>    Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
-F, --format <format>             Output format (human, json, json-stream) (default: human)

## activity

Description:** Show last deployments of an application

**Usage**
clever activity [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-f, --follow                   Track new deployments in activity list
-F, --format <format>          Output format (human, json, json-stream) (default: human)
    --show-all                 Show all activity

## addon

Description:** Manage add-ons

**Usage**
clever addon [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### addon create

Description:** Create an add-on

**Usage**
clever addon create <addon-provider> <addon-name> [options]

**Arguments**
addon-provider                          Add-on provider
addon-name                              Add-on name

**Options**
    --addon-version <addon-version>     The version to use for the add-on
-F, --format <format>                   Output format (human, json) (default: human)
-l, --link <alias>                      Link the created add-on to the app with the specified alias
    --option <option>                   Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
-p, --plan <plan>                       Add-on plan, depends on the provider
-r, --region <region>                   Region to provision the add-on in, depends on the provider (default: par)
-y, --yes                               Skip confirmation even if the add-on is not free

### addon delete

Description:** Delete an add-on

**Usage**
clever addon delete <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name                     Add-on ID (or name, if unambiguous)

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
-y, --yes                               Skip confirmation and delete the add-on directly

### addon env

Description:** List environment variables for an add-on

**Usage**
clever addon env <addon-id> [options]

**Arguments**
addon-id                                Add-on ID or real ID

**Options**
-F, --format <format>                   Output format (human, json, shell) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### addon list

Description:** List available add-ons

**Usage**
clever addon list [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### addon providers

Description:** List available add-on providers

**Usage**
clever addon providers [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### addon providers show

Description:** Show information about an add-on provider

**Usage**
clever addon providers show <addon-provider> [options]

**Arguments**
addon-provider           Add-on provider

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### addon rename

Description:** Rename an add-on

**Usage**
clever addon rename <addon-id|addon-name> <addon-name> [options]

**Arguments**
addon-id|addon-name                     Add-on ID (or name, if unambiguous)
addon-name                              Add-on name

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## applications

Description:** List linked applications

**Usage**
clever applications [options]

**Options**
-j, --json            Show result in JSON format
    --only-aliases    List only application aliases

### applications list

Description:** List all applications

**Usage**
clever applications list [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## cancel-deploy

Description:** Cancel an ongoing deployment

**Usage**
clever cancel-deploy [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## config

Description:** Display or edit the configuration of your application

**Usage**
clever config [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### config get

Description:** Display the current configuration

**Usage**
clever config get <configuration-name> [options]

**Arguments**
configuration-name             Configuration to manage: name, description, zero-downtime, sticky-sessions, cancel-on-push, force-https, or task

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### config set

Description:** Edit one configuration setting

**Usage**
clever config set <configuration-name> <configuration-value> [options]

**Arguments**
configuration-name             Configuration to manage: name, description, zero-downtime, sticky-sessions, cancel-on-push, force-https, or task
configuration-value            The new value of the configuration

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### config update

Description:** Edit multiple configuration settings at once

**Usage**
clever config update [options]

**Options**
-a, --alias <alias>                Short name for the application
    --app <app-id|app-name>        Application to manage by its ID (or name, if unambiguous)
    --description <description>    Set application description
    --disable-cancel-on-push       Disable cancel on push
    --disable-force-https          Disable force HTTPS redirection
    --disable-sticky-sessions      Disable sticky sessions
    --disable-task                 Disable application as Clever Task
    --disable-zero-downtime        Disable zero-downtime deployment
    --enable-cancel-on-push        Enable cancel on push
    --enable-force-https           Enable force HTTPS redirection
    --enable-sticky-sessions       Enable sticky sessions
    --enable-task                  Enable application as Clever Task
    --enable-zero-downtime         Enable zero-downtime deployment
    --name <name>                  Set application name

## console

Description:** Open an application in the Console

**Usage**
clever console [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## create

Description:** Create an application

**Usage**
clever create --type <instance-type> [<app-name>] [options]

**Arguments**
app-name                                Application name (current directory name is used if not specified) (optional)

**Options**
-t, --type <instance-type>              Instance type (required)
-a, --alias <alias>                     Short name for the application
-F, --format <format>                   Output format (human, json) (default: human)
    --github <owner/repo>               GitHub application to use for deployments
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
-r, --region <zone>                     Region, can be 'par', 'parhds', 'grahds', 'rbx', 'rbxhds', 'scw', 'ldn', 'mtl', 'sgp', 'syd', 'wsw' (default: par)
-T, --task <command>                    The application launch as a task executing the given command, then stopped

## curl

Description:** Query Clever Cloud's API using Clever Tools credentials

**Usage**
clever curl

## database

Description:** Manage databases and backups

**Usage**
clever database

### database backups

Description:** List available database backups

**Usage**
clever database backups <database-id|addon-id> [options]

**Arguments**
database-id|addon-id                    Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

#### database backups download

Description:** Download a database backup

**Usage**
clever database backups download <database-id|addon-id> <backup-id> [options]

**Arguments**
database-id|addon-id                    Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)
backup-id                               A Database backup ID (format: UUID)

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
    --output, --out <file-path>         Redirect the output of the command in a file

## delete

Description:** Delete an application

**Usage**
clever delete [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-y, --yes                      Skip confirmation and delete the application directly

## deploy

Description:** Deploy an application

**Usage**
clever deploy [options]

**Options**
-a, --alias <alias>                  Short name for the application
-b, --branch <branch>                Branch to push (current branch by default)
-e, --exit-on <step>                 Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
    --follow                         Continue to follow logs after deployment has ended (deprecated, use `--exit-on never` instead)
-f, --force                          Force deploy even if it's not fast-forwardable
-q, --quiet                          Don't show logs during deployment
-p, --same-commit-policy <policy>    What to do when local and remote commit are identical (error, ignore, restart, rebuild) (default: error)
-t, --tag <tag>                      Tag to push (none by default)

## diag

Description:** Diagnose the current installation (prints various informations for support)

**Usage**
clever diag [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

## domain

Description:** Manage domain names for an application

**Usage**
clever domain [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

### domain add

Description:** Add a domain name to an application

**Usage**
clever domain add <fqdn> [options]

**Arguments**
fqdn                           Domain name of the application

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### domain diag

Description:** Check if domains associated to a specific app are properly configured

**Usage**
clever domain diag [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
    --filter <text>            Check only domains containing the provided text
-F, --format <format>          Output format (human, json) (default: human)

### domain favourite

Description:** Manage the favourite domain name for an application

**Usage**
clever domain favourite [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

#### domain favourite set

Description:** Set the favourite domain for an application

**Usage**
clever domain favourite set <fqdn> [options]

**Arguments**
fqdn                           Domain name of the application

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

#### domain favourite unset

Description:** Unset the favourite domain for an application

**Usage**
clever domain favourite unset [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### domain overview

Description:** Get an overview of all your domains (all orgas, all apps)

**Usage**
clever domain overview [options]

**Options**
    --filter <text>      Get only domains containing the provided text
-F, --format <format>    Output format (human, json) (default: human)

### domain rm

Description:** Remove a domain name from an application

**Usage**
clever domain rm <fqdn> [options]

**Arguments**
fqdn                           Domain name of the application

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## drain

Description:** Manage drains

**Usage**
clever drain [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

### drain create

Description:** Create a drain

**Usage**
clever drain create <drain-type> <drain-url> [options]

**Arguments**
drain-type                           No description available
drain-url                            Drain URL

**Options**
-a, --alias <alias>                  Short name for the application
-k, --api-key <api-key>              API key (for newrelic)
    --app <app-id|app-name>          Application to manage by its ID (or name, if unambiguous)
-i, --index-prefix <index-prefix>    Optional index prefix (for elasticsearch), `logstash` value is used if not set
-p, --password <password>            Basic auth password (for elasticsearch or raw-http)
-s, --sd-params <sd-params>          RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`
-u, --username <username>            Basic auth username (for elasticsearch or raw-http)

### drain disable

Description:** Disable a drain

**Usage**
clever drain disable <drain-id> [options]

**Arguments**
drain-id                       Drain ID

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### drain enable

Description:** Enable a drain

**Usage**
clever drain enable <drain-id> [options]

**Arguments**
drain-id                       Drain ID

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### drain get

Description:** Get drain info

**Usage**
clever drain get <drain-id> [options]

**Arguments**
drain-id                       Drain ID

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

### drain remove

Description:** Remove a drain

**Usage**
clever drain remove <drain-id> [options]

**Arguments**
drain-id                       Drain ID

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## emails

Description:** Manage email addresses of the current user

**Usage**
clever emails [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### emails add

Description:** Add a new secondary email address to the current user

**Usage**
clever emails add <email>

**Arguments**
email    Email address

### emails open

Description:** Open the email addresses management page in the Console

**Usage**
clever emails open

### emails primary

Description:** Set the primary email address of the current user

**Usage**
clever emails primary <email>

**Arguments**
email    Email address

### emails remove

Description:** Remove a secondary email address from the current user

**Usage**
clever emails remove <email>

**Arguments**
email    Email address

### emails remove-all

Description:** Remove all secondary email addresses from the current user

**Usage**
clever emails remove-all [options]

**Options**
-y, --yes    Skip confirmation

## env

Description:** Manage environment variables of an application

**Usage**
clever env [options]

**Options**
    --add-export               Display sourceable env variables setting (deprecated, use `--format shell` instead)
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json, shell) (default: human)

### env import

Description:** Load environment variables from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

**Usage**
clever env import [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
    --json                     Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects)

### env import-vars

Description:** Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

**Usage**
clever env import-vars <variable-names> [options]

**Arguments**
variable-names                 Comma separated list of names of the environment variables

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### env rm

Description:** Remove an environment variable from an application

**Usage**
clever env rm <variable-name> [options]

**Arguments**
variable-name                  Name of the environment variable

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### env set

Description:** Add or update an environment variable named <variable-name> with the value <variable-value>

**Usage**
clever env set <variable-name> <variable-value> [options]

**Arguments**
variable-name                  Name of the environment variable
variable-value                 Value of the environment variable

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## features

Description:** Manage Clever Tools experimental features

**Usage**
clever features [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### features disable

Description:** Disable experimental features

**Usage**
clever features disable <features>

**Arguments**
features    Comma-separated list of experimental features to manage

### features enable

Description:** Enable experimental features

**Usage**
clever features enable <features>

**Arguments**
features    Comma-separated list of experimental features to manage

### features info

Description:** Display info about an experimental feature

**Usage**
clever features info <feature>

**Arguments**
feature    Experimental feature to manage

### features list

Description:** List available experimental features

**Usage**
clever features list [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

## help

Description:** Display help about the Clever Cloud CLI

**Usage**
clever help

## k8s

Description:** Manage Kubernetes clusters

**Usage**
clever k8s

### k8s add-persistent-storage

Description:** Activate persistent storage to a deployed Kubernetes cluster

**Usage**
clever k8s add-persistent-storage <cluster-id|cluster-name> [options]

**Arguments**
cluster-id|cluster-name                 Kubernetes cluster ID or name

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### k8s create

Description:** Create a Kubernetes cluster

**Usage**
clever k8s create <cluster-name> [options]

**Arguments**
cluster-name                            Kubernetes cluster name

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
-w, --watch                             Watch the deployment until the cluster is deployed

### k8s delete

Description:** Delete a Kubernetes cluster

**Usage**
clever k8s delete <cluster-id|cluster-name> [options]

**Arguments**
cluster-id|cluster-name                 Kubernetes cluster ID or name

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
-y, --yes                               Skip confirmation and delete the add-on directly

### k8s get

Description:** Get information about a Kubernetes cluster

**Usage**
clever k8s get <cluster-id|cluster-name> [options]

**Arguments**
cluster-id|cluster-name                 Kubernetes cluster ID or name

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### k8s get-kubeconfig

Description:** Get configuration of a Kubernetes cluster

**Usage**
clever k8s get-kubeconfig <cluster-id|cluster-name> [options]

**Arguments**
cluster-id|cluster-name                 Kubernetes cluster ID or name

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### k8s list

Description:** List Kubernetes clusters

**Usage**
clever k8s list [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## keycloak

Description:** Manage Clever Cloud Keycloak services

**Usage**
clever keycloak [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### keycloak disable-ng

Description:** Unlink Keycloak from its Network Group

**Usage**
clever keycloak disable-ng <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### keycloak enable-ng

Description:** Link Keycloak to a Network Group, used for multi-instances secure communication

**Usage**
clever keycloak enable-ng <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### keycloak get

Description:** Get information about a deployed Keycloak

**Usage**
clever keycloak get <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### keycloak open

Description:** Open the Keycloak dashboard in Clever Cloud Console

**Usage**
clever keycloak open <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### keycloak open logs

Description:** Open the Keycloak application logs in Clever Cloud Console

**Usage**
clever keycloak open logs <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### keycloak open webui

Description:** Open the Keycloak admin console in your browser

**Usage**
clever keycloak open webui <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### keycloak rebuild

Description:** Rebuild Keycloak

**Usage**
clever keycloak rebuild <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### keycloak restart

Description:** Restart Keycloak

**Usage**
clever keycloak restart <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### keycloak version

Description:** Check Keycloak deployed version

**Usage**
clever keycloak version <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### keycloak version check

Description:** Check Keycloak deployed version

**Usage**
clever keycloak version check <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### keycloak version update

Description:** Update Keycloak deployed version

**Usage**
clever keycloak version update <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name       Add-on ID (or name, if unambiguous)

**Options**
    --target <version>    Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)

## kv

Description:** Send a raw command to a Materia KV or Redis® add-on

**Usage**
clever kv <kv-id|addon-id|addon-name> <command> [options]

**Arguments**
kv-id|addon-id|addon-name               Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on
command                                 The raw command to send to the Materia KV or Redis® add-on

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## link

Description:** Link this repo to an existing application

**Usage**
clever link <app-id|app-name> [options]

**Arguments**
app-id|app-name                         Application ID (or name, if unambiguous)

**Options**
-a, --alias <alias>                     Short name for the application
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## login

Description:** Login to Clever Cloud

**Usage**
clever login [options]

**Options**
    --secret <secret>    Directly give an existing secret
    --token <token>      Directly give an existing token

## logout

Description:** Logout from Clever Cloud

**Usage**
clever logout

## logs

Description:** Fetch application logs, continuously

**Usage**
clever logs [options]

**Options**
    --addon <addon-id>                 Add-on ID
    --after, --since <after>           Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
-a, --alias <alias>                    Short name for the application
    --app <app-id|app-name>            Application to manage by its ID (or name, if unambiguous)
    --before, --until <before>         Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
    --deployment-id <deployment-id>    Fetch logs for a given deployment
-F, --format <format>                  Output format (human, json, json-stream) (default: human)
    --search <search>                  Fetch logs matching this pattern

## make-default

Description:** Make a linked application the default one

**Usage**
clever make-default <app-alias>

**Arguments**
app-alias    Application alias

## matomo

Description:** Manage Clever Cloud Matomo services

**Usage**
clever matomo [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### matomo get

Description:** Get information about a deployed Matomo

**Usage**
clever matomo get <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### matomo open

Description:** Open the Matomo dashboard in Clever Cloud Console

**Usage**
clever matomo open <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### matomo open logs

Description:** Open the Matomo application logs in Clever Cloud Console

**Usage**
clever matomo open logs <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### matomo open webui

Description:** Open the Matomo admin console in your browser

**Usage**
clever matomo open webui <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### matomo rebuild

Description:** Rebuild Matomo

**Usage**
clever matomo rebuild <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### matomo restart

Description:** Restart Matomo

**Usage**
clever matomo restart <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

## metabase

Description:** Manage Clever Cloud Metabase services

**Usage**
clever metabase [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### metabase get

Description:** Get information about a deployed Metabase

**Usage**
clever metabase get <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### metabase open

Description:** Open the Metabase dashboard in Clever Cloud Console

**Usage**
clever metabase open <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### metabase open logs

Description:** Open the Metabase application logs in Clever Cloud Console

**Usage**
clever metabase open logs <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### metabase open webui

Description:** Open the Metabase admin console in your browser

**Usage**
clever metabase open webui <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### metabase rebuild

Description:** Rebuild Metabase

**Usage**
clever metabase rebuild <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### metabase restart

Description:** Restart Metabase

**Usage**
clever metabase restart <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### metabase version

Description:** Manage Metabase deployed version

**Usage**
clever metabase version <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### metabase version check

Description:** Check Metabase deployed version

**Usage**
clever metabase version check <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### metabase version update

Description:** Update Metabase deployed version

**Usage**
clever metabase version update <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name       Add-on ID (or name, if unambiguous)

**Options**
    --target <version>    Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)

## ng

Description:** List Network Groups

**Usage**
clever ng [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### ng create

Description:** Create a Network Group

**Usage**
clever ng create <ng-label> [options]

**Arguments**
ng-label                                Network Group label

**Options**
    --description <description>         Network Group description
    --link <members-ids>                Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
    --tags <tags>                       List of tags, separated by a comma

#### ng create external

Description:** Create an external peer in a Network Group

**Usage**
clever ng create external <external-peer-label> <ng-id|ng-label> <public-key> [options]

**Arguments**
external-peer-label                     External peer label
ng-id|ng-label                          Network Group ID or label
public-key                              WireGuard public key of the external peer to link to a Network Group

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### ng delete

Description:** Delete a Network Group

**Usage**
clever ng delete <ng-id|ng-label> [options]

**Arguments**
ng-id|ng-label                          Network Group ID or label

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

#### ng delete external

Description:** Delete an external peer from a Network Group

**Usage**
clever ng delete external <peer-id|peer-label> <ng-id|ng-label> [options]

**Arguments**
peer-id|peer-label                      External peer ID or label
ng-id|ng-label                          Network Group ID or label

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### ng get

Description:** Get details about a Network Group, a member or a peer

**Usage**
clever ng get <id|label> [options]

**Arguments**
id|label                                ID or Label of a Network Group, a member or an (external) peer

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
    --type <resource-type>              Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)

### ng get-config

Description:** Get the WireGuard configuration of a peer in a Network Group

**Usage**
clever ng get-config <peer-id|peer-label> <ng-id|ng-label> [options]

**Arguments**
peer-id|peer-label                      External peer ID or label
ng-id|ng-label                          Network Group ID or label

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### ng link

Description:** Link a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) to a Network Group

**Usage**
clever ng link <id> <ng-id|ng-label> [options]

**Arguments**
id                                      ID of a resource to (un)link to a Network Group
ng-id|ng-label                          Network Group ID or label

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### ng search

Description:** Search Network Groups, members or peers and get their details

**Usage**
clever ng search <id|label> [options]

**Arguments**
id|label                                ID or Label of a Network Group, a member or an (external) peer

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
    --type <resource-type>              Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)

### ng unlink

Description:** Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group

**Usage**
clever ng unlink <id> <ng-id|ng-label> [options]

**Arguments**
id                                      ID of a resource to (un)link to a Network Group
ng-id|ng-label                          Network Group ID or label

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## notify-email

Description:** Manage email notifications

**Usage**
clever notify-email [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
    --list-all                          List all notifications for your user or for an organisation with the '--org' option
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### notify-email add

Description:** Add a new email notification

**Usage**
clever notify-email add --notify <email-address|user-id|organisation> <name> [options]

**Arguments**
name                                                 Notification name

**Options**
    --notify <email-address|user-id|organisation>    Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated) (required)
    --event <event-type>                             Restrict notifications to specific event types
-o, --org, --owner <org-id|org-name>                 Organisation to target by its ID (or name, if unambiguous)
    --service <service-id>                           Restrict notifications to specific applications and add-ons

### notify-email remove

Description:** Remove an existing email notification

**Usage**
clever notify-email remove <notification-id> [options]

**Arguments**
notification-id                         Notification ID

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## open

Description:** Open an application in the Console

**Usage**
clever open [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## otoroshi

Description:** Manage Clever Cloud Otoroshi services

**Usage**
clever otoroshi [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### otoroshi disable-ng

Description:** Unlink Otoroshi from its Network Group

**Usage**
clever otoroshi disable-ng <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi enable-ng

Description:** Link Otoroshi to a Network Group

**Usage**
clever otoroshi enable-ng <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi get

Description:** Get information about a deployed Otoroshi

**Usage**
clever otoroshi get <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### otoroshi get-config

Description:** Get configuration of a deployed Otoroshi in otoroshictl format

**Usage**
clever otoroshi get-config <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi open

Description:** Open the Otoroshi dashboard in Clever Cloud Console

**Usage**
clever otoroshi open <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### otoroshi open logs

Description:** Open the Otoroshi application logs in Clever Cloud Console

**Usage**
clever otoroshi open logs <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

#### otoroshi open webui

Description:** Open the Otoroshi admin console in your browser

**Usage**
clever otoroshi open webui <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi rebuild

Description:** Rebuild Otoroshi

**Usage**
clever otoroshi rebuild <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi restart

Description:** Restart Otoroshi

**Usage**
clever otoroshi restart <addon-id|addon-name>

**Arguments**
addon-id|addon-name    Add-on ID (or name, if unambiguous)

### otoroshi version

Description:** Manage Otoroshi deployed version

**Usage**
clever otoroshi version <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### otoroshi version check

Description:** Check Otoroshi deployed version

**Usage**
clever otoroshi version check <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name      Add-on ID (or name, if unambiguous)

**Options**
-F, --format <format>    Output format (human, json) (default: human)

#### otoroshi version update

Description:** Update Otoroshi deployed version

**Usage**
clever otoroshi version update <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name       Add-on ID (or name, if unambiguous)

**Options**
    --target <version>    Target version to upgrade to (e.g.: 24, 2.4, 2.4.1)

## profile

Description:** Display the profile of the current user

**Usage**
clever profile [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### profile open

Description:** Open your profile in the Console

**Usage**
clever profile open

## published-config

Description:** Manage the configuration made available to other applications by this application

**Usage**
clever published-config [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json, shell) (default: human)

### published-config import

Description:** Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

**Usage**
clever published-config import [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
    --json                     Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects)

### published-config rm

Description:** Remove a published configuration variable from an application

**Usage**
clever published-config rm <variable-name> [options]

**Arguments**
variable-name                  Name of the environment variable

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### published-config set

Description:** Add or update a published configuration item named <variable-name> with the value <variable-value>

**Usage**
clever published-config set <variable-name> <variable-value> [options]

**Arguments**
variable-name                  Name of the environment variable
variable-value                 Value of the environment variable

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## restart

Description:** Start or restart an application

**Usage**
clever restart [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
    --commit <commit-id>       Restart the application with a specific commit ID
-e, --exit-on <step>           Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
    --follow                   Continue to follow logs after deployment has ended (deprecated, use `--exit-on never` instead)
-q, --quiet                    Don't show logs during deployment
    --without-cache            Restart the application without using cache

## scale

Description:** Change scalability of an application

**Usage**
clever scale [options]

**Options**
-a, --alias <alias>             Short name for the application
    --app <app-id|app-name>     Application to manage by its ID (or name, if unambiguous)
    --build-flavor <flavor>     The size of the build instance, or 'disabled' if you want to disable dedicated build instances
    --flavor <flavor>           The instance size of your application
    --instances <instances>     The number of parallel instances
    --max-flavor <flavor>       The maximum instance size of your application
    --max-instances <number>    The maximum number of parallel instances
    --min-flavor <flavor>       The minimum scale size of your application
    --min-instances <number>    The minimum number of parallel instances

## service

Description:** Manage service dependencies

**Usage**
clever service [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)
    --only-addons              Only show add-on dependencies
    --only-apps                Only show app dependencies
    --show-all                 Show all available add-ons and applications

### service link-addon

Description:** Link an existing add-on to this application

**Usage**
clever service link-addon <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name            Add-on ID (or name, if unambiguous)

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### service link-app

Description:** Add an existing app as a dependency

**Usage**
clever service link-app <app-id|app-name> [options]

**Arguments**
app-id|app-name                Application ID (or name, if unambiguous)

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### service unlink-addon

Description:** Unlink an add-on from this application

**Usage**
clever service unlink-addon <addon-id|addon-name> [options]

**Arguments**
addon-id|addon-name            Add-on ID (or name, if unambiguous)

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### service unlink-app

Description:** Remove an app from the dependencies

**Usage**
clever service unlink-app <app-id|app-name> [options]

**Arguments**
app-id|app-name                Application ID (or name, if unambiguous)

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## ssh

Description:** Connect to running instances through SSH

**Usage**
clever ssh [options]

**Options**
-a, --alias <alias>                    Short name for the application
    --app <app-id|app-name>            Application to manage by its ID (or name, if unambiguous)
-i, --identity-file <identity-file>    SSH identity file

## ssh-keys

Description:** Manage SSH keys of the current user

**Usage**
clever ssh-keys [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### ssh-keys add

Description:** Add a new SSH key to the current user

**Usage**
clever ssh-keys add <ssh-key-name> <ssh-key-path>

**Arguments**
ssh-key-name    SSH key name
ssh-key-path    SSH public key path (.pub)

### ssh-keys open

Description:** Open the SSH keys management page in the Console

**Usage**
clever ssh-keys open

### ssh-keys remove

Description:** Remove a SSH key from the current user

**Usage**
clever ssh-keys remove <ssh-key-name>

**Arguments**
ssh-key-name    SSH key name

### ssh-keys remove-all

Description:** Remove all SSH keys from the current user

**Usage**
clever ssh-keys remove-all [options]

**Options**
-y, --yes    Skip confirmation and remove all SSH keys directly

## status

Description:** See the status of an application

**Usage**
clever status [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

## stop

Description:** Stop a running application

**Usage**
clever stop [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## tcp-redirs

Description:** Control the TCP redirections from reverse proxies to your application

**Usage**
clever tcp-redirs [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

### tcp-redirs add

Description:** Add a new TCP redirection to the application

**Usage**
clever tcp-redirs add --namespace <namespace> [options]

**Options**
    --namespace <namespace>    Namespace in which the TCP redirection should be (required)
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

### tcp-redirs list-namespaces

Description:** List the namespaces in which you can create new TCP redirections

**Usage**
clever tcp-redirs list-namespaces [options]

**Options**
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)
-F, --format <format>          Output format (human, json) (default: human)

### tcp-redirs remove

Description:** Remove a TCP redirection from the application

**Usage**
clever tcp-redirs remove --namespace <namespace> <port> [options]

**Arguments**
port                           port identifying the TCP redirection

**Options**
    --namespace <namespace>    Namespace in which the TCP redirection should be (required)
-a, --alias <alias>            Short name for the application
    --app <app-id|app-name>    Application to manage by its ID (or name, if unambiguous)

## tokens

Description:** Manage API tokens to query Clever Cloud API from https://api-bridge.clever-cloud.com

**Usage**
clever tokens [options]

**Options**
-F, --format <format>    Output format (human, json) (default: human)

### tokens create

Description:** Create an API token

**Usage**
clever tokens create <api-token-name> [options]

**Arguments**
api-token-name                   API token name

**Options**
-e, --expiration <expiration>    Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M) (default: 1y)
-F, --format <format>            Output format (human, json) (default: human)

### tokens revoke

Description:** Revoke an API token

**Usage**
clever tokens revoke <api-token-id>

**Arguments**
api-token-id    API token ID

## unlink

Description:** Unlink this repo from an existing application

**Usage**
clever unlink <app-alias>

**Arguments**
app-alias    Application alias

## version

Description:** Display the clever-tools version

**Usage**
clever version

## webhooks

Description:** Manage webhooks

**Usage**
clever webhooks [options]

**Options**
-F, --format <format>                   Output format (human, json) (default: human)
    --list-all                          List all notifications for your user or for an organisation with the '--org' option
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

### webhooks add

Description:** Register webhook to be called when events happen

**Usage**
clever webhooks add <name> <url> [options]

**Arguments**
name                                    Notification name
url                                     Webhook URL

**Options**
    --event <event-type>                Restrict notifications to specific event types
    --format <format>                   Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: raw)
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)
    --service <service-id>              Restrict notifications to specific applications and add-ons

### webhooks remove

Description:** Remove an existing webhook

**Usage**
clever webhooks remove <notification-id> [options]

**Arguments**
notification-id                         Notification ID

**Options**
-o, --org, --owner <org-id|org-name>    Organisation to target by its ID (or name, if unambiguous)

## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: https://www.clever-cloud.com/developers/doc/
Clever Cloud complete documentation is available in a LLM-optimized format: https://www.clever-cloud.com/developers/llms.txt
