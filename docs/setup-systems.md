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

## GNU/Linux

### Arch Linux (AUR)

If you are using Arch Linux, the packages can be installed from AUR with this repo: [clever-tools-bin](https://aur.archlinux.org/packages/clever-tools-bin/). If you don't know how to use this, you can run:

```
git clone https://aur.archlinux.org/clever-tools-bin.git clever-tools
cd clever-tools
makepkg -si
```

### CentOS/Fedora (.rpm)

If you are using a GNU/Linux distribution that uses `.rpm` packages like CentOS or Fedora, you can run:

```
curl -s https://clever-tools.clever-cloud.com/repos/cc-nexus-rpm.repo > /etc/yum.repos.d/cc-nexus-rpm.repo
yum update
yum install clever-tools
```

NOTES:

* The `.rpm` packages are hosted on Clever Cloud's public Nexus instance available at [https://nexus.clever-cloud.com](https://nexus.clever-cloud.com).
* If you want access to the beta channel, you will need to edit `/etc/yum.repos.d/cc-nexus-rpm.repo` and set `enabled=1` for the `[clever-tools-beta]`.

### Debian/Ubuntu (.deb)

If you are using a GNU/Linux distribution that uses `.deb` packages like Debian or Ubuntu, you can run:

```
curl -fsSL https://clever-tools.clever-cloud.com/gpg/cc-nexus-deb.public.gpg.key | gpg --dearmor -o /usr/share/keyrings/cc-nexus-deb.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/cc-nexus-deb.gpg] https://nexus.clever-cloud.com/repository/deb stable main" | tee -a /etc/apt/sources.list
apt-get update
apt-get install clever-tools
```

NOTES:

* The `.deb` packages are hosted on Clever Cloud's public Nexus instance available at [https://nexus.clever-cloud.com](https://nexus.clever-cloud.com).
* Our PGP key is required to trust the repository.
* If you want access to the beta channel, you can use this in your `sources.list`:

```sh
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/cc-nexus-deb.gpg] https://nexus.clever-cloud.com/repository/deb-beta beta main" | tee -a /etc/apt/sources.list
```

### Exherbo

If you are using Exherbo, you can run:

```
cave resolve repository/CleverCloud -zx1
cave resolve clever-tools-bin -zx
```

### Other distributions (.tar.gz)

If you are using another GNU/Linux distribution, you can download a `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz
tar xvzf clever-tools-latest_linux.tar.gz
cp clever-tools-latest_linux/clever ~/.local/bin/
```

NOTES:

* The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_linux.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz).
* You can also retrieve any release (including beta) on this Cellar bucket by replacing `latest` (path and filename) with the version number you need.

## macOS

### Homebrew

If you are using macOS and you have [homebrew](https://brew.sh) installed, you can run:

```
brew install CleverCloud/homebrew-tap/clever-tools
```

### Binary (.tar.gz)

If you are using macOS, but you don't have [Homebrew](https://brew.sh) installed, you can download a `.tar.gz` archive and extract the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz
tar xvzf clever-tools-latest_macos.tar.gz
cp clever-tools-latest_macos/clever ~/.local/bin/
```

NOTES:

* The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_macos.tar.gz](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz).
* You can also retrieve any release (including beta) on this Cellar bucket by replacing `latest` (path and filename) with the version number you need.

## Windows

### Chocolatey

If you are using Windows and you have [chocolatey](https://chocolatey.org) installed, you can run:

```
choco sources add -n=clevercloud -s='https://nexus.clever-cloud.com/repository/nupkg/'
choco install clever-tools
```

### Binary (.zip)

If you are using Windows, but you don't have [chocolatey](https://chocolatey.org) installed, you can download a `.zip` archive and extract the binary in your `PATH`.

NOTES:

* The packages are available on Clever Cloud's Cellar bucket: [clever-tools-latest_win.zip](https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip).
* You can also retrieve any release (including beta) on this Cellar bucket by replacing `latest` (path and filename) with the version number you need.

## Docker

If you are using docker, you can use the image provided [here](https://hub.docker.com/r/clevercloud/clever-tools/).

```
docker pull clevercloud/clever-tools
docker run --rm clever-tools <command>
```

### Dockerfile

In your `Dockerfile` you can copy the clever-tools CLI from the image itself with a simple one liner:

```Dockerfile
COPY --from=clevercloud/clever-tools /bin/clever /usr/local/bin/clever
```
