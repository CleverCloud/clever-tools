# Clever Tools

Deploy on Clever Cloud and control you applications, add-ons, services from command line.

## Installation

Clever Tools are availables from many channels. The simpler way to install them, if you already have Node.js on your system, is through `npm` package manager:

```sh
npm install -g clever-tools
```

If you want to install our latest beta release, you can run:

```sh
npm install -g clever-tools@beta
```
We also distribute binaries and packages for multiple systems and tools:

* [GNU/Linux](docs/setup-systems.md#gnulinux)
  * [Arch Linux (AUR)](docs/setup-systems.md#arch-linux-aur)
  * [CentOS/Fedora (.rpm)](docs/setup-systems.md#centosfedora-rpm)
  * [Debian/Ubuntu (.deb)](docs/setup-systems.md#debianubuntu-deb)
  * [Exherbo](docs/setup-systems.md#exherbo)
  * [Binary (.tar.gz)](docs/setup-systems.md#other-distributions-targz)
* [macOS](docs/setup-systems.md#macos)
  * [Homebrew](docs/setup-systems.md#homebrew)
  * [Binary (.tar.gz)](docs/setup-systems.md#binary-zip)
* [Windows](docs/setup-systems.md#windows)
  * [Chocolatey](docs/setup-systems.md#chocolatey)
  * [Binary (.zip)](docs/setup-systems.md#binary-zip)
* [Docker](docs/setup-systems.md#docker)
* [Nix](docs/setup-systems.md#nix-package-manager)

## Enabling autocompletion

The clever-tools CLI comes with a comprehensive auto-completion system. Some installation methods through package managers will try to enable it automatically. If not, use this for bash:

```bash
clever --bash-autocomplete-script $(which clever) | sudo tee /usr/share/bash-completion/completions/clever
```

or that for zsh:

```bash
clever --zsh-autocomplete-script $(which clever) | sudo tee /usr/share/zsh/site-functions
```

## How to use

### Login

To use `clever-tools`, you have to login.

```sh
clever login
```

It will open the Web console in your browser and reuse your existing session if you're already logged in.

`clever login` tries to open a browser through `xdg-open` on GNU/Linux systems (and in bash for windows).
Make sure you have `xdg-utils` available as well as a default browser set, or you can copy and paste the URL displayed in the console.

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
- `meteor`: for Meteor applications launched with Node.js
- `node`: for Node.js applications
- `php`: for PHP applications
- `play1`: for Play1 applications
- `play2`: for Play2 applications
- `python`: for python27 and python3 applications
- `ruby`: for ruby applications
- `rust`: for rust applications
- `sbt`: for applications launched with SBT
- `static-apache`: for static (HTML only) websites
- `war`: for applications deployed as war files

Where region is one of:

- `par` (Paris, [Clever Cloud](https://www.clever-cloud.com/infrastructure/))
- `rbx` (Roubaix, OVHcloud)
- `rbxhds` (Roubaix, HDS servers, OVHcloud)
- `scw` (Paris, [Scaleway DC5](https://www.clever-cloud.com/blog/press/2023/01/17/clever-cloud-and-scaleway-join-forces-to-unveil-a-sovereign-european-paas-offering/))
- `jed` (Jeddah, Oracle Cloud)
- `mtl` (Montreal, OVHcloud)
- `sgp` (Singapore, OVHcloud)
- `syd` (Sydney, OVHcloud)
- `wsw` (Warsaw, OVHcloud)

`--org` allows you to chose the organisation in which your app is created.

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

## Automated releases

This project uses Jenkins to build binaries, package them and release them automatically on the various repositories.
If you want to know more or if you need to release a new version, please read [RELEASE.md](./RELEASE.md) carefully.
