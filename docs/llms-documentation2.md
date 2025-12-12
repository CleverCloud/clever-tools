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

**Description:** Fetch access logs

```bash
clever accesslogs [options]
```

**Options:**
```
[--addon] addon-id          Add-on ID
[--after, --since] after    Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--alias, -a] alias         Short name for the application
[--app] app-id|app-name     Application to manage by its ID (or name, if unambiguous)
[--before, --until] before  Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--format, -F] format       Output format (${...}) (default: human)
```

## activity

**Description:** Show last deployments of an application

```bash
clever activity [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--follow, -f]           Track new deployments in activity list (default: false)
[--format, -F] format    Output format (${...}) (default: human)
[--show-all]             Show all activity (default: false)
```

## addon

**Description:** Manage add-ons

```bash
clever addon [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### addon create

**Description:** Create an add-on

```bash
clever addon create <addon-provider> <addon-name> [options]
```

**Arguments:**
```
addon-provider  Add-on provider
addon-name      Add-on name
```

**Options:**
```
[--addon-version] addon-version       The version to use for the add-on
[--format, -F] format                 Output format (${...}) (default: human)
[--link, -l] alias                    Link the created add-on to the app with the specified alias
[--option] option                     Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--plan, -p] plan                     Add-on plan, depends on the provider
[--region, -r] region                 Region to provision the add-on in, depends on the provider (default: par)
[--yes, -y]                           Skip confirmation even if the add-on is not free (default: false)
```

### addon delete

**Description:** Delete an add-on

```bash
clever addon delete <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                           Skip confirmation and delete the add-on directly (default: false)
```

### addon env

**Description:** List environment variables for an add-on

```bash
clever addon env [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### addon list

**Description:** List available add-ons

```bash
clever addon list [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### addon providers

**Description:** List available add-on providers

```bash
clever addon providers [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### addon rename

**Description:** Rename an add-on

```bash
clever addon rename <addon-name> <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-name           Add-on name
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## applications

**Description:** List linked applications

```bash
clever applications [options]
```

**Options:**
```
[--json, -j]      Show result in JSON format (default: false)
[--only-aliases]  List only application aliases (default: false)
```

### applications list

**Description:** List all applications

```bash
clever applications list [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## cancel-deploy

**Description:** Cancel an ongoing deployment

```bash
clever cancel-deploy [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## config

**Description:** Display or edit the configuration of your application

```bash
clever config [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### config get

**Description:** Display the current configuration

```bash
clever config get <configuration-name> [options]
```

**Arguments:**
```
configuration-name  Configuration to manage: ${...}
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### config set

**Description:** Edit one configuration setting

```bash
clever config set <configuration-value> <configuration-name> [options]
```

**Arguments:**
```
configuration-value  The new value of the configuration
configuration-name   Configuration to manage: ${...}
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### config update

**Description:** Edit multiple configuration settings at once

```bash
clever config update [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## console

**Description:** Open an application in the Console

```bash
clever console [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## create

**Description:** Create an application

```bash
clever create --type <instance-type> [app-name] [options]
```

**Arguments:**
```
app-name  Application name (optional, current directory name is used if not specified) (optional)
```

**Options:**
```
--type, -t instance-type              Instance type
[--alias, -a] alias                   Short name for the application
[--format, -F] format                 Output format (${...}) (default: human)
[--github] owner/repo                 GitHub application to use for deployments
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--region, -r] zone                   Region, can be ${...} (default: par)
[--task, -T] command                  The application launch as a task executing the given command, then stopped
```

## curl

**Description:** Query Clever Cloud's API using Clever Tools credentials

```bash
clever curl
```

## database

**Description:** Manage databases and backups

```bash
clever database
```

### database backups

**Description:** List available database backups

```bash
clever database backups <database-id|addon-id> [options]
```

**Arguments:**
```
database-id|addon-id  Any database ID (format: addon_UUID, postgresql_UUID, mysql_UUID, ...)
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## delete

**Description:** Delete an application

```bash
clever delete [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--yes, -y]              Skip confirmation and delete the application directly (default: false)
```

## deploy

**Description:** Deploy an application

```bash
clever deploy [options]
```

**Options:**
```
[--alias, -a] alias                Short name for the application
[--branch, -b] branch              Branch to push (current branch by default)
[--exit-on, -e] step               Step at which the logs streaming is ended, steps are: ${...} (default: deploy-end)
[--follow]                         Continue to follow logs after deployment has ended (default: false)
[--force, -f]                      Force deploy even if it's not fast-forwardable (default: false)
[--quiet, -q]                      Don't show logs during deployment (default: false)
[--same-commit-policy, -p] policy  What to do when local and remote commit are identical (${...}) (default: error)
[--tag, -t] tag                    Tag to push (none by default)
```

## diag

**Description:** Diagnose the current installation (prints various informations for support)

```bash
clever diag [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## domain

**Description:** Manage domain names for an application

```bash
clever domain [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### domain add

**Description:** Add a domain name to an application

```bash
clever domain add <fqdn> [options]
```

**Arguments:**
```
fqdn  Domain name of the application
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### domain diag

**Description:** Check if domains associated to a specific app are properly configured

```bash
clever domain diag [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--filter] text          Check only domains containing the provided text
[--format, -F] format    Output format (${...}) (default: human)
```

### domain favourite

**Description:** Manage the favourite domain name for an application

```bash
clever domain favourite [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### domain overview

**Description:** Get an overview of all your domains (all orgas, all apps)

```bash
clever domain overview [options]
```

**Options:**
```
[--filter] text        Get only domains containing the provided text
[--format, -F] format  Output format (${...}) (default: human)
```

### domain rm

**Description:** Remove a domain name from an application

```bash
clever domain rm <fqdn> [options]
```

**Arguments:**
```
fqdn  Domain name of the application
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## drain

**Description:** Manage drains

```bash
clever drain [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### drain create

**Description:** Create a drain

```bash
clever drain create <drain-type> <drain-url> [options]
```

**Arguments:**
```
drain-type  No description available
drain-url   Drain URL
```

**Options:**
```
[--alias, -a] alias                Short name for the application
[--api-key, -k] api-key            API key (for newrelic)
[--app] app-id|app-name            Application to manage by its ID (or name, if unambiguous)
[--index-prefix, -i] index-prefix  Optional index prefix (for elasticsearch), `logstash` value is used if not set
[--password, -p] password          Basic auth password (for elasticsearch or raw-http)
[--sd-params, -s] sd-params        RFC5424 structured data parameters (for ovh-tcp), e.g.: `X-OVH-TOKEN=\"REDACTED\"`
[--username, -u] username          Basic auth username (for elasticsearch or raw-http)
```

### drain disable

**Description:** Disable a drain

```bash
clever drain disable <drain-id> [options]
```

**Arguments:**
```
drain-id  Drain ID
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### drain enable

**Description:** Enable a drain

```bash
clever drain enable <drain-id> [options]
```

**Arguments:**
```
drain-id  Drain ID
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### drain get

**Description:** Get drain info

```bash
clever drain get <drain-id> [options]
```

**Arguments:**
```
drain-id  Drain ID
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### drain remove

**Description:** Remove a drain

```bash
clever drain remove <drain-id> [options]
```

**Arguments:**
```
drain-id  Drain ID
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## emails

**Description:** Manage email addresses of the current user

```bash
clever emails [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### emails add

**Description:** Add a new secondary email address to the current user

```bash
clever emails add <email>
```

**Arguments:**
```
email  Email address
```

### emails open

**Description:** Open the email addresses management page in the Console

```bash
clever emails open
```

### emails primary

**Description:** Set the primary email address of the current user

```bash
clever emails primary <email>
```

**Arguments:**
```
email  Email address
```

### emails remove

**Description:** Remove a secondary email address from the current user

```bash
clever emails remove <email>
```

**Arguments:**
```
email  Email address
```

### emails remove-all

**Description:** Remove all secondary email addresses from the current user

```bash
clever emails remove-all [options]
```

**Options:**
```
[--yes, -y]  Skip confirmation (default: false)
```

## env

**Description:** Manage environment variables of an application

```bash
clever env [options]
```

**Options:**
```
[--add-export]           Display sourceable env variables setting (default: false)
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### env import

**Description:** Load environment variables from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever env import [options]
```

**Options:**
```
[--add-export]           Display sourceable env variables setting (default: false)
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--json]                 Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

### env import-vars

**Description:** Add or update environment variables named <variable-names> (comma-separated), taking their values from the current environment

```bash
clever env import-vars <variable-names> [options]
```

**Arguments:**
```
variable-names  Comma separated list of names of the environment variables
```

**Options:**
```
[--add-export]           Display sourceable env variables setting (default: false)
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### env rm

**Description:** Remove an environment variable from an application

```bash
clever env rm <variable-name> [options]
```

**Arguments:**
```
variable-name  Name of the environment variable
```

**Options:**
```
[--add-export]           Display sourceable env variables setting (default: false)
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### env set

**Description:** Add or update an environment variable named <variable-name> with the value <variable-value>

```bash
clever env set <variable-name> <variable-value> [options]
```

**Arguments:**
```
variable-name   Name of the environment variable
variable-value  Value of the environment variable
```

**Options:**
```
[--add-export]           Display sourceable env variables setting (default: false)
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## features

**Description:** Manage Clever Tools experimental features

```bash
clever features
```

### features disable

**Description:** Disable experimental features

```bash
clever features disable <features>
```

**Arguments:**
```
features  Comma-separated list of experimental features to manage
```

### features enable

**Description:** Enable experimental features

```bash
clever features enable <features>
```

**Arguments:**
```
features  Comma-separated list of experimental features to manage
```

### features info

**Description:** Display info about an experimental feature

```bash
clever features info <feature>
```

**Arguments:**
```
feature  Experimental feature to manage
```

### features list

**Description:** List available experimental features

```bash
clever features list [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## k8s

**Description:** Manage Kubernetes clusters

```bash
clever k8s
```

### k8s add-persistent-storage

**Description:** Activate persistent storage to a deployed Kubernetes cluster

```bash
clever k8s add-persistent-storage <cluster-id|cluster-name> [options]
```

**Arguments:**
```
cluster-id|cluster-name  Kubernetes cluster ID or name
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### k8s create

**Description:** Create a Kubernetes cluster

```bash
clever k8s create <cluster-name> [options]
```

**Arguments:**
```
cluster-name  Kubernetes cluster name
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--watch, -w]                         Watch the deployment until the cluster is deployed (default: false)
```

### k8s delete

**Description:** Delete a Kubernetes cluster

```bash
clever k8s delete <cluster-id|cluster-name> [options]
```

**Arguments:**
```
cluster-id|cluster-name  Kubernetes cluster ID or name
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--yes, -y]                           Skip confirmation and delete the add-on directly (default: false)
```

### k8s get

**Description:** Get information about a Kubernetes cluster

```bash
clever k8s get <cluster-id|cluster-name> [options]
```

**Arguments:**
```
cluster-id|cluster-name  Kubernetes cluster ID or name
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### k8s get-kubeconfig

**Description:** Get configuration of a Kubernetes cluster

```bash
clever k8s get-kubeconfig <cluster-id|cluster-name> [options]
```

**Arguments:**
```
cluster-id|cluster-name  Kubernetes cluster ID or name
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### k8s list

**Description:** List Kubernetes clusters

```bash
clever k8s list [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## keycloak

**Description:** Manage Clever Cloud Keycloak services

```bash
clever keycloak [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### keycloak disable-ng

**Description:** Unlink Keycloak from its Network Group

```bash
clever keycloak disable-ng <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### keycloak enable-ng

**Description:** Link Keycloak to a Network Group, used for multi-instances secure communication

```bash
clever keycloak enable-ng <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### keycloak get

**Description:** Get information about a deployed Keycloak

```bash
clever keycloak get <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### keycloak open

**Description:** Open the Keycloak dashboard in Clever Cloud Console

```bash
clever keycloak open <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### keycloak rebuild

**Description:** Rebuild Keycloak

```bash
clever keycloak rebuild <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### keycloak restart

**Description:** Restart Keycloak

```bash
clever keycloak restart <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### keycloak version

**Description:** Check Keycloak deployed version

```bash
clever keycloak version <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## kv

**Description:** Send a raw command to a Materia KV or Redis® add-on

```bash
clever kv <kv-id|addon-id|addon-name> <command> [options]
```

**Arguments:**
```
kv-id|addon-id|addon-name  Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on
command                    The raw command to send to the Materia KV or Redis® add-on
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## link

**Description:** Link this repo to an existing application

```bash
clever link <app-id|app-name> [options]
```

**Arguments:**
```
app-id|app-name  Application ID (or name, if unambiguous)
```

**Options:**
```
[--alias, -a] alias                   Short name for the application
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## login

**Description:** Login to Clever Cloud

```bash
clever login [options]
```

**Options:**
```
[--secret] secret  Directly give an existing secret
[--token] token    Directly give an existing token
```

## logout

**Description:** Logout from Clever Cloud

```bash
clever logout
```

## logs

**Description:** Fetch application logs, continuously

```bash
clever logs [options]
```

**Options:**
```
[--addon] addon-id               Add-on ID
[--after, --since] after         Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--alias, -a] alias              Short name for the application
[--app] app-id|app-name          Application to manage by its ID (or name, if unambiguous)
[--before, --until] before       Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--deployment-id] deployment-id  Fetch logs for a given deployment
[--format, -F] format            Output format (${...}) (default: human)
[--search] search                Fetch logs matching this pattern
```

## make-default

**Description:** Make a linked application the default one

```bash
clever make-default <app-alias>
```

**Arguments:**
```
app-alias  Application alias
```

## matomo

**Description:** Manage Clever Cloud Matomo services

```bash
clever matomo [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### matomo get

**Description:** Get information about a deployed Matomo

```bash
clever matomo get <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### matomo open

**Description:** Open the Matomo dashboard in Clever Cloud Console

```bash
clever matomo open <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### matomo rebuild

**Description:** Rebuild Matomo

```bash
clever matomo rebuild <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### matomo restart

**Description:** Restart Matomo

```bash
clever matomo restart <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

## metabase

**Description:** Manage Clever Cloud Metabase services

```bash
clever metabase [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### metabase get

**Description:** Get information about a deployed Metabase

```bash
clever metabase get <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### metabase open

**Description:** Open the Metabase dashboard in Clever Cloud Console

```bash
clever metabase open <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### metabase rebuild

**Description:** Rebuild Metabase

```bash
clever metabase rebuild <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### metabase restart

**Description:** Restart Metabase

```bash
clever metabase restart <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### metabase version

**Description:** Manage Metabase deployed version

```bash
clever metabase version <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## ng

**Description:** List Network Groups

```bash
clever ng [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### ng create

**Description:** Create a Network Group

```bash
clever ng create <ng-label> [options]
```

**Arguments:**
```
ng-label  Network Group label
```

**Options:**
```
[--description] description           Network Group description
[--link] members-ids                  Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--tags] tags                         List of tags, separated by a comma
```

### ng delete

**Description:** Delete a Network Group

```bash
clever ng delete <ng-id|ng-label> [options]
```

**Arguments:**
```
ng-id|ng-label  Network Group ID or label
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### ng get

**Description:** Get details about a Network Group, a member or a peer

```bash
clever ng get <id|label> [options]
```

**Arguments:**
```
id|label  ID or Label of a Network Group, a member or an (external) peer
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--type] resource-type                Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
```

### ng get-config

**Description:** Get the WireGuard configuration of a peer in a Network Group

```bash
clever ng get-config <peer-id|peer-label> <ng-id|ng-label> [options]
```

**Arguments:**
```
peer-id|peer-label  External peer ID or label
ng-id|ng-label      Network Group ID or label
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### ng link

**Description:** Link a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) to a Network Group

```bash
clever ng link <id> <ng-id|ng-label> [options]
```

**Arguments:**
```
id              ID of a resource to (un)link to a Network Group
ng-id|ng-label  Network Group ID or label
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### ng search

**Description:** Search Network Groups, members or peers and get their details

```bash
clever ng search <id|label> [options]
```

**Arguments:**
```
id|label  ID or Label of a Network Group, a member or an (external) peer
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--type] resource-type                Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)
```

### ng unlink

**Description:** Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group

```bash
clever ng unlink <id> <ng-id|ng-label> [options]
```

**Arguments:**
```
id              ID of a resource to (un)link to a Network Group
ng-id|ng-label  Network Group ID or label
```

**Options:**
```
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## notify-email

**Description:** Manage email notifications

```bash
clever notify-email [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--list-all]                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### notify-email add

**Description:** Add a new email notification

```bash
clever notify-email add --notify <email-address|user-id|organisation> <name> [options]
```

**Arguments:**
```
name  Notification name
```

**Options:**
```
--notify email-address|user-id|organisation  Notify a user, a specific email address or the whole organisation (multiple values allowed, comma separated)
[--event] event-type                         Restrict notifications to specific event types
[--list-all]                                 List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name         Organisation to target by its ID (or name, if unambiguous)
[--service] service-id                       Restrict notifications to specific applications and add-ons
```

### notify-email remove

**Description:** Remove an existing email notification

```bash
clever notify-email remove <notification-id> [options]
```

**Arguments:**
```
notification-id  Notification ID
```

**Options:**
```
[--list-all]                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## open

**Description:** Open an application in the Console

```bash
clever open [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## otoroshi

**Description:** Manage Clever Cloud Otoroshi services

```bash
clever otoroshi [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### otoroshi disable-ng

**Description:** Unlink Otoroshi from its Network Group

```bash
clever otoroshi disable-ng <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi enable-ng

**Description:** Link Otoroshi to a Network Group

```bash
clever otoroshi enable-ng <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi get

**Description:** Get information about a deployed Otoroshi

```bash
clever otoroshi get <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### otoroshi get-config

**Description:** Get configuration of a deployed Otoroshi in otoroshictl format

```bash
clever otoroshi get-config <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi open

**Description:** Open the Otoroshi dashboard in Clever Cloud Console

```bash
clever otoroshi open <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi rebuild

**Description:** Rebuild Otoroshi

```bash
clever otoroshi rebuild <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi restart

**Description:** Restart Otoroshi

```bash
clever otoroshi restart <addon-id|addon-name>
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

### otoroshi version

**Description:** Manage Otoroshi deployed version

```bash
clever otoroshi version <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## profile

**Description:** Display the profile of the current user

```bash
clever profile [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### profile open

**Description:** Open your profile in the Console

```bash
clever profile open [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

## published-config

**Description:** Manage the configuration made available to other applications by this application

```bash
clever published-config [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### published-config import

**Description:** Load published configuration from STDIN
(WARNING: this deletes all current variables and replace them with the new list loaded from STDIN)

```bash
clever published-config import [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--json]                 Import variables as JSON (an array of { "name": "THE_NAME", "value": "THE_VALUE" } objects) (default: false)
```

### published-config rm

**Description:** Remove a published configuration variable from an application

```bash
clever published-config rm <variable-name> [options]
```

**Arguments:**
```
variable-name  Name of the environment variable
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### published-config set

**Description:** Add or update a published configuration item named <variable-name> with the value <variable-value>

```bash
clever published-config set <variable-name> <variable-value> [options]
```

**Arguments:**
```
variable-name   Name of the environment variable
variable-value  Value of the environment variable
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## restart

**Description:** Start or restart an application

```bash
clever restart [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--commit] commit-id     Restart the application with a specific commit ID
[--exit-on, -e] step     Step at which the logs streaming is ended, steps are: ${...} (default: deploy-end)
[--follow]               Continue to follow logs after deployment has ended (default: false)
[--quiet, -q]            Don't show logs during deployment (default: false)
[--without-cache]        Restart the application without using cache (default: false)
```

## scale

**Description:** Change scalability of an application

```bash
clever scale [options]
```

**Options:**
```
[--alias, -a] alias             Short name for the application
[--app] app-id|app-name         Application to manage by its ID (or name, if unambiguous)
[--build-flavor] buildflavor    The size of the build instance, or 'disabled' if you want to disable dedicated build instances
[--flavor] flavor               The instance size of your application
[--instances] instances         The number of parallel instances
[--max-flavor] maxflavor        The maximum instance size of your application
[--max-instances] maxinstances  The maximum number of parallel instances
[--min-flavor] minflavor        The minimum scale size of your application
[--min-instances] mininstances  The minimum number of parallel instances
```

## service

**Description:** Manage service dependencies

```bash
clever service [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
[--only-addons]          Only show add-on dependencies (default: false)
[--only-apps]            Only show app dependencies (default: false)
[--show-all]             Show all available add-ons and applications (default: false)
```

### service link-addon

**Description:** Link an existing add-on to this application

```bash
clever service link-addon <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--only-addons]          Only show add-on dependencies (default: false)
[--only-apps]            Only show app dependencies (default: false)
[--show-all]             Show all available add-ons and applications (default: false)
```

### service link-app

**Description:** Add an existing app as a dependency

```bash
clever service link-app <app-id|app-name> [options]
```

**Arguments:**
```
app-id|app-name  Application ID (or name, if unambiguous)
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--only-addons]          Only show add-on dependencies (default: false)
[--only-apps]            Only show app dependencies (default: false)
[--show-all]             Show all available add-ons and applications (default: false)
```

### service unlink-addon

**Description:** Unlink an add-on from this application

```bash
clever service unlink-addon <addon-id|addon-name> [options]
```

**Arguments:**
```
addon-id|addon-name  Add-on ID (or name, if unambiguous)
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--only-addons]          Only show add-on dependencies (default: false)
[--only-apps]            Only show app dependencies (default: false)
[--show-all]             Show all available add-ons and applications (default: false)
```

### service unlink-app

**Description:** Remove an app from the dependencies

```bash
clever service unlink-app <app-id|app-name> [options]
```

**Arguments:**
```
app-id|app-name  Application ID (or name, if unambiguous)
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--only-addons]          Only show add-on dependencies (default: false)
[--only-apps]            Only show app dependencies (default: false)
[--show-all]             Show all available add-ons and applications (default: false)
```

## ssh

**Description:** Connect to running instances through SSH

```bash
clever ssh [options]
```

**Options:**
```
[--alias, -a] alias                  Short name for the application
[--app] app-id|app-name              Application to manage by its ID (or name, if unambiguous)
[--identity-file, -i] identity-file  SSH identity file
```

## ssh-keys

**Description:** Manage SSH keys of the current user

```bash
clever ssh-keys [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### ssh-keys add

**Description:** Add a new SSH key to the current user

```bash
clever ssh-keys add <ssh-key-path> <ssh-key-name>
```

**Arguments:**
```
ssh-key-path  SSH public key path (.pub)
ssh-key-name  SSH key name
```

### ssh-keys open

**Description:** Open the SSH keys management page in the Console

```bash
clever ssh-keys open
```

### ssh-keys remove

**Description:** Remove a SSH key from the current user

```bash
clever ssh-keys remove <ssh-key-name>
```

**Arguments:**
```
ssh-key-name  SSH key name
```

### ssh-keys remove-all

**Description:** Remove all SSH keys from the current user

```bash
clever ssh-keys remove-all [options]
```

**Options:**
```
[--yes, -y]  Skip confirmation and remove all SSH keys directly (default: false)
```

## status

**Description:** See the status of an application

```bash
clever status [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

## stop

**Description:** Stop a running application

```bash
clever stop [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## tcp-redirs

**Description:** Control the TCP redirections from reverse proxies to your application

```bash
clever tcp-redirs [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### tcp-redirs add

**Description:** Add a new TCP redirection to the application

```bash
clever tcp-redirs add --namespace <namespace> [options]
```

**Options:**
```
--namespace namespace    Namespace in which the TCP redirection should be
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

### tcp-redirs list-namespaces

**Description:** List the namespaces in which you can create new TCP redirections

```bash
clever tcp-redirs list-namespaces [options]
```

**Options:**
```
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
[--format, -F] format    Output format (${...}) (default: human)
```

### tcp-redirs remove

**Description:** Remove a TCP redirection from the application

```bash
clever tcp-redirs remove --namespace <namespace> <port> [options]
```

**Arguments:**
```
port  port identifying the TCP redirection
```

**Options:**
```
--namespace namespace    Namespace in which the TCP redirection should be
[--alias, -a] alias      Short name for the application
[--app] app-id|app-name  Application to manage by its ID (or name, if unambiguous)
```

## tokens

**Description:** Manage API tokens to query Clever Cloud API from ${...}

```bash
clever tokens [options]
```

**Options:**
```
[--format, -F] format  Output format (${...}) (default: human)
```

### tokens create

**Description:** Create an API token

```bash
clever tokens create <api-token-name> [options]
```

**Arguments:**
```
api-token-name  API token name
```

**Options:**
```
[--expiration, -e] expiration  Duration until API token expiration (e.g.: 1h, 4d, 2w, 6M), default 1y
[--format, -F] format          Output format (${...}) (default: human)
```

### tokens revoke

**Description:** Revoke an API token

```bash
clever tokens revoke <api-token-id>
```

**Arguments:**
```
api-token-id  API token ID
```

## unlink

**Description:** Unlink this repo from an existing application

```bash
clever unlink <app-alias>
```

**Arguments:**
```
app-alias  Application alias
```

## version

**Description:** Display the clever-tools version

```bash
clever version
```

## webhooks

**Description:** Manage webhooks

```bash
clever webhooks [options]
```

**Options:**
```
[--format, -F] format                 Output format (${...}) (default: human)
[--list-all]                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

### webhooks add

**Description:** Register webhook to be called when events happen

```bash
clever webhooks add <url> <name> [options]
```

**Arguments:**
```
url   Webhook URL
name  Notification name
```

**Options:**
```
[--event] event-type                  Restrict notifications to specific event types
[--format] format                     Format of the body sent to the webhook ('raw', 'slack', 'gitter', or 'flowdock') (default: raw)
[--list-all]                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
[--service] service-id                Restrict notifications to specific applications and add-ons
```

### webhooks remove

**Description:** Remove an existing webhook

```bash
clever webhooks remove <notification-id> [options]
```

**Arguments:**
```
notification-id  Notification ID
```

**Options:**
```
[--list-all]                          List all notifications for your user or for an organisation with the '--org' option (default: false)
[--org, -o, --owner] org-id|org-name  Organisation to target by its ID (or name, if unambiguous)
```

## Clever Cloud complete documentation

For more comprehensive information about Clever Cloud, read the complete documentation: https://www.clever-cloud.com/developers/doc/
Clever Cloud complete documentation is available in a LLM-optimized format: https://www.clever-cloud.com/developers/llms.txt
