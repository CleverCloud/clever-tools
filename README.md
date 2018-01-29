# clever-tools

[![Build Status](https://travis-ci.org/CleverCloud/clever-tools.svg?branch=master)](https://travis-ci.org/CleverCloud/clever-tools)

Command Line Interface for Clever Cloud.

## Installation

⚠️ *We no longer support the usage and installation of Clever Tools via a global npm install.*

Please follow the installation instructions for your platform (see below) and make sure to uninstall the npm version with this:

    npm uninstall -g clever-tools

Please refer to <https://www.clever-cloud.com/doc/clever-tools/getting_started/> for the installation details.

### MacOS

Clever Tools is packaged using [homebrew](https://brew.sh):

    brew install CleverCloud/tap/clever-tools

If you don't want to use `brew`, a pre-compiled version is available: [clever-tools-latest_macos.tar.gz](https://clever-tools.cellar.services.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz).
You need to put both files (`clever` and `nodegit.node`) in your `PATH` to use the application.

#### Autocompletion

Clever Tools comes with a comprehensive auto-completion system. The brew package installs it automatically (for `bash` and `zsh`). Make sure `bash-completions` or `zsh-completions` are properly set up.

    # In ~/.bash_profile
    . /usr/local/etc/bash_completion

    # In ~/.zshrc
    fpath=(/usr/local/share/zsh-completions $fpath)

### Windows

Clever Tools is packaged using [chocolatey](https://chocolatey.org):

    choco install clever-tools

If you don't want to use `chocolatey`, a pre-compiled version is available: [clever-tools-latest_win.zip](https://clever-tools.cellar.services.clever-cloud.com/releases/latest/clever-tools-latest_win.zip).
You need to add both files (`clever.exe` and `nodegit.node`) to your `PATH` to use the application.

### GNU/Linux

#### Archlinux

The package is available on the AUR: [clever-tools-bin](https://aur.archlinux.org/packages/clever-tools-bin/)

#### Other distributions

A pre-compiled version is available: [clever-tools-latest_linux.tar.gz](https://clever-tools.cellar.services.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz).
You need to add both files (`clever` and `nodegit.node`) to your `PATH`
(you can put them in `~/.local/bin` for instance)
to use the application.

    curl -O https://clever-tools.cellar.services.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz
    tar zxf clever-tools-latest_linux.tar.gz
    cp {clever,nodegit.node} ~/.local/bin/

#### Autocompletion

Clever Tools comes with a comprehensive auto-completion system.

    # for bash
    clever --bash-autocomplete-script $(which clever) | sudo tee /usr/share/bash-completion/completions/clever

    # for zsh
    clever --zsh-autocomplete-script $(which clever) | sudo tee /usr/share/zsh/site-functions

## How to use

### Login

To use `clever-tools`, you have to login.

```sh
clever login
```

It will open a page in your browser. Copy the provided `token` and `secret`
codes in the CLI.

`clever login` tries to open a browser through `xdg-open` on GNU/Linux systems
(and in bash for windows). Make sure you have `xdg-utils` available as well as
a default browser set (or you can copy and paste the URL displayed in the
console.

### Create an application

```sh
clever create <name> --type <type> \
  [--region <region>] \
  [--org <organisation>] \
  [--alias <alias>]
```

Where `type` is one of:

- `docker`: for Docker-based applications
- `go`: for Go applications
- `gradle`: for applications launched with gradle
- `haskell`: for haskell applications
- `jar`: for applications deployed as standalone jar files
- `maven`: for applications launched with maven
- `node`: for node.js applications
- `php`: for PHP applications
- `play1`: for Play1 applications
- `play2`: for Play2 applications
- `python`: for python27 applications
- `ruby`: for ruby applications
- `rust`: for rust applications
- `sbt`: for applications launched with SBT
- `static-apache`: for static (HTML only) websites
- `war`: for applications deployed as war files

Where region is one of:

- `par` (for Paris)
- `mtl` (for Montreal)

`--org` allows you to chose the organisation in which your app is
created.

`--alias` allows you to deploy the same application in multiple environments on Clever Cloud (eg: production, testing, …)

### Link an existing application

```sh
clever link [--org <ORG-NAME>] <APP-NAME> [--alias <alias>]
```

Where `APP-NAME` is the name of your application, and `ORG-NAME` is the name
of the organisation it's in. You can specify a complete application id instead
of its name (in that case, `--org` can be omitted).

### Deploy an application

```sh
clever deploy [--alias <alias>]
```

`--alias` allows you to deploy your application several times on Clever Cloud
(eg: production, testing, …)

### Application status

```sh
clever status [--alias <alias>]
```

### Change application scalability

```sh
clever scale [--alias <alias>] [--min-flavor <minflavor>] [--max-flavor <maxflavor>] [--min-instances <mininstances>] [--max-instances <maxinstances>]
```

### Logs Drains

```sh
# create drain
clever drain create [--alias <alias>] <DRAIN-TYPE> <DRAIN-URL> [--username <username>] [--password <password>]
```

```sh
# list drains
clever drain [--alias <alias>]
```

```sh
# remove drain
clever drain remove [--alias <alias>] <DRAIN-ID>
```

Where `DRAIN-TYPE` is one of:

- `TCPSyslog`: for TCP syslog endpoint ;
- `UDPSyslog`: for UDP syslog endpoint ;
- `HTTP`: for TCP syslog endpoint (note that this endpoint has optional username/passwordparameters as HTTP Basic Authentication);
- `ElasticSearch`: for ElasticSearch endpoint (note that this endpoint requires username/password parameters as HTTP Basic Authentication).

### Display help

You can display help about each command with `clever help`.

```sh
clever help
clever help deploy
```

## Examples

```sh
cd node_project
clever login
clever create "Node.js application" -t node -r mtl
clever deploy
```

## How to send feedback?

[Send us an email!](mailto:support@clever-cloud.com) or [submit an issue](https://github.com/CleverCloud/clever-tools/issues).
