# How to update Clever Tools

The command to update Clever Tools depends on how you installed it. If you're not sure, see [how to install Clever Tools](/docs/setup-systems.md).

- [Node.js (npm)](#nodejs-npm)
- [GNU/Linux](#gnulinux)
  - [Arch Linux (AUR)](#arch-linux-aur)
  - [CentOS/Fedora (.rpm)](#centosfedora-rpm)
  - [Debian/Ubuntu (.deb)](#debianubuntu-deb)
  - [Exherbo](#exherbo)
  - [Binary (.tar.gz)](#other-distributions-targz)
- [macOS](#macos)
  - [Homebrew](#homebrew)
  - [Binary (.tar.gz)](#binary-targz)
- [Windows](#windows)
  - [WinGet](#winget)
  - [Binary (.zip)](#binary-zip)
- [Docker](#docker)
- [Nix package manager](#nix-package-manager)

## Node.js (npm)

```
npm install -g clever-tools
```

## GNU/Linux

### Arch Linux (AUR)

From the directory where you cloned the AUR package:

```
git -C clever-tools pull
makepkg -si -C clever-tools
```

### CentOS/Fedora (.rpm)

```
yum update clever-tools
```

### Debian/Ubuntu (.deb)

```
apt update
apt install --only-upgrade clever-tools
```

### Exherbo

```
cave sync
cave resolve clever-tools-bin -zx
```

### Other distributions (.tar.gz)

Download the latest archive again and replace the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_linux.tar.gz
tar xvzf clever-tools-latest_linux.tar.gz
cp clever-tools-latest_linux/clever ~/.local/bin/
```

## macOS

### Homebrew

```
brew upgrade CleverCloud/homebrew-tap/clever-tools
```

### Binary (.tar.gz)

Download the latest archive again and replace the binary in your `PATH`:

```
curl -O https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_macos.tar.gz
tar xvzf clever-tools-latest_macos.tar.gz
cp clever-tools-latest_macos/clever ~/.local/bin/
```

## Windows

### WinGet

```
winget upgrade CleverTools
```

### Binary (.zip)

Download the latest archive again and replace the binary in your `PATH`:

```PowerShell
Invoke-WebRequest https://clever-tools.clever-cloud.com/releases/latest/clever-tools-latest_win.zip -OutFile clever-tools-latest_win.zip
Expand-Archive .\clever-tools-latest_win.zip -DestinationPath .
```

## Docker

Pull the image again to get the latest tag:

```
docker pull clevercloud/clever-tools
```

## Nix package manager

Update your channel or flake input, then upgrade the package as usual for your setup. See [these instructions](https://search.nixos.org/packages?channel=unstable&show=clever-tools&from=0&size=50&sort=relevance&type=packages&query=clever-tools).
