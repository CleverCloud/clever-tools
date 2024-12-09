# How to install Clever Tools

Clever Cloud CLI is based on Node.js. We thought it to be easily available on any platform. Thus, you can download Clever Tools as [a npm package](https://www.npmjs.com/package/clever-tools), but also through package managers or as a binary on many systems:

- [GNU/Linux](/docs/setup-systems.md#gnulinux)
  - [Arch Linux (AUR)](/docs/setup-systems.md#arch-linux-aur)
  - [CentOS/Fedora (.rpm)](/docs/setup-systems.md#centosfedora-rpm)
  - [Debian/Ubuntu (.deb)](/docs/setup-systems.md#debianubuntu-deb)
  - [Exherbo](/docs/setup-systems.md#exherbo)
  - [Binary (.tar.gz)](/docs/setup-systems.md#other-distributions-targz)
- [macOS](/docs/setup-systems.md#macos)
  - [Homebrew](/docs/setup-systems.md#homebrew)
  - [Binary (.tar.gz)](/docs/setup-systems.md#binary-zip)
- [Windows](/docs/setup-systems.md#windows)
  - [Chocolatey](/docs/setup-systems.md#chocolatey)
  - [Binary (.zip)](/docs/setup-systems.md#binary-zip)
- [Docker](/docs/setup-systems.md#docker)
- [Nix package manager](/docs/setup-systems.md#nix-package-manager)

## GNU/Linux

### Arch Linux (AUR)

If you use Arch Linux, install packages [from AUR](https://aur.archlinux.org/packages/clever-tools-bin/). If you don't know how to use this, run:

```
git clone https://aur.archlinux.org/clever-tools-bin.git clever-tools
cd clever-tools
makepkg -si
```

### CentOS/Fedora (.rpm)

If you use a GNU/Linux distribution that uses `.rpm` packages like CentOS or Fedora, run:

```
curl -s https://clever-tools.clever-cloud.com/repos/cc-nexus-rpm.repo > /etc/yum.repos.d/cc-nexus-rpm.repo
yum update
yum install clever-tools
```

> [!TIP]
> The `.rpm` packages are hosted on Clever Cloud's public Nexus instance available at [https://nexus.clever-cloud.com](https://nexus.clever-cloud.com)

### Debian/Ubuntu (.deb)

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

### Exherbo

If you are using Exherbo, run:

```
cave resolve repository/CleverCloud -zx1
cave resolve clever-tools-bin -zx
```

### Other distributions (.tar.gz)

If you use another GNU/Linux distribution, download the `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz
tar xvzf clever-tools-latest_linux.tar.gz
cp clever-tools-latest_linux/clever ~/.local/bin/
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_linux.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz). \
>  Retrieve any release by replacing `latest` (path and filename) with the version number you need.

## macOS

### Homebrew

If you use macOS and you have [Homebrew](https://brew.sh) installed, run:

```
brew install CleverCloud/homebrew-tap/clever-tools
```

### Binary (.tar.gz)

If you use macOS, but you don't have [Homebrew](https://brew.sh) installed, download the `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz
tar xvzf clever-tools-latest_macos.tar.gz
cp clever-tools-latest_macos/clever ~/.local/bin/
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_macos.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz). \
> Retrieve any release by replacing `latest` (path and filename) with the version number you need.

## Windows

### Chocolatey

If you use Windows and you have [Chocolatey](https://chocolatey.org) installed, run:

```
choco sources add -n=clevercloud -s='https://nexus.clever-cloud.com/repository/nupkg/'
choco install clever-tools
```

### Binary (.zip)

If you use Windows, but you don't have [Chocolatey](https://chocolatey.org) installed, download the `.zip` archive and extract the binary in your `PATH`:

```PowerShell
Invoke-WebRequest https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip -OutFile clever-tools-latest_win.zip
Expand-Archive .\clever-tools-latest_win.zip -DestinationPath .
$env:PATH += ";$(Resolve-Path .\clever-tools-latest_win\)"
```

> [!TIP]
> The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_win.zip](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip). \
> Retrieve any release by replacing `latest` (path and filename) with the version number you need.

## Docker

If you are using docker, use the image provided [here](https://hub.docker.com/r/clevercloud/clever-tools/).

```
docker pull clevercloud/clever-tools
docker run --rm clever-tools <command>
```

### Dockerfile

In your `Dockerfile` copy `clever-tools` from the image itself with a simple one liner:

```Dockerfile
COPY --from=clevercloud/clever-tools /bin/clever /usr/local/bin/clever
```

## Nix package manager

If you are using Nix on NixOS or any other compatible system, the package is available in both `stable` and `unstable` channels. Follow [these instructions](https://search.nixos.org/packages?channel=unstable&show=clever-tools&from=0&size=50&sort=relevance&type=packages&query=clever-tools).
