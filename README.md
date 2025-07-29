# Clever Tools

Deploy on Clever Cloud and control your applications, add-ons, services from command line.

- [Create a Clever Cloud account](https://console.clever-cloud.com)

## Installation

Clever Tools are available from many channels. The simpler way to install them, if you already have Node.js on your system, is through `npm` package manager:

```bash
npm install -g clever-tools
```

You can use it through `npx` or `npm exec` without installing it globally:

```bash
# Set/Export CLEVER_TOKEN and CLEVER_SECRET to login with a given account
# --yes is used to skip the interactive prompts
npx --yes clever-tools@latest version
npm exec -- clever-tools@3.14 profile --format json
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
* [Nix package manager](docs/setup-systems.md#nix-package-manager)

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

You can then login and check everything is working:

```bash
clever login
clever profile
```

Discover how to use Clever Tools through [our documentation](docs/).

## Examples

Discover how to deploy many applications on Clever Cloud within [our guides](https://www.clever-cloud.com/developers/guides/).

## How to send feedback?

[Send us an email!](mailto:support@clever-cloud.com) or [submit an issue](https://github.com/CleverCloud/clever-tools/issues).

## Automated releases

This project uses GitHub Actions to build binaries, package them and release them automatically on the various repositories.
If you want to know more or if you need to release a new version, please read [RELEASE.md](./RELEASE.md) carefully.

## License

This project is licensed under the [Apache-2.0](https://spdx.org/licenses/Apache-2.0.html).
