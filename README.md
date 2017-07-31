[![Build Status](https://travis-ci.org/CleverCloud/clever-tools.svg?branch=master)](https://travis-ci.org/CleverCloud/clever-tools)

clever-tools
============

Command Line Interface for Clever Cloud.

## Installation

```
# openssl-dev is needed
apt-get install openssl-dev# on apt systems

npm install -g clever-tools

# Install completion scripts
install-clever-completion
```

## How to use

### Login

To use `clever-tools`, you have to login.

```
clever login
```

It will open a page in your browser. Copy the provided `token` and `secret`
codes in the CLI.

`clever login` tries to open a browser through `xdg-open` on GNU/Linux systems
(and in bash for windows). Make sure you have `xdg-utils` available as well as
a default browser set (or you can copy and paste the URL displayed in the
console.

### Create an application

```
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
 - `static`: for static (HTML only) websites
 - `war`: for applications deployed as war files

Where region is one of:

 - `par` (for Paris)
 - `mtl` (for Montreal)

`--org` allows you to chose the organisation in which your app is
created.

`--alias` allows you to deploy the same application in multiple environments on Clever Cloud (eg: production, testing, …)

### Link an existing application

```
clever link [--org <ORG-NAME>] <APP-NAME> [--alias <alias>]
```
Where `APP-NAME` is the name of your application, and `ORG-NAME` is the name
of the organisation it's in. You can specify a complete application id instead
of its name (in that case, `--org` can be omitted).

### Deploy an application

```
clever deploy [--alias <alias>]
```

`--alias` allows you to deploy your application several times on Clever Cloud
(eg: production, testing, …)

### Application status

```
clever status [--alias <alias>]
```

### Change application scalability

```
clever scale [--alias <alias>] [--min-flavor <minflavor>] [--max-flavor <maxflavor>] [--min-instances <mininstances>] [--max-instances <maxinstances>]
```

### Logs Drains

```bash
# create drain
clever drain create [--alias <alias>] <DRAIN-TYPE> <DRAIN-URL> [--username <username>] [--password <password>]
```

```bash
# list drains
clever drain [--alias <alias>]
```

```bash
# remove drain
clever drain remove [--alias <alias>] <DRAIN-ID>
```

Where `DRAIN-TYPE` is one of:

 - `TCPSyslog`: for TCP syslog endpoint ;
 - `UDPSyslog`: for UDP syslog endpoint ;
 - `HTTP`: for TCP syslog endpoint (note that this endpoint has optional username/password parameters as HTTP Basic Authentication);
 - `ElasticSearch`: for ElasticSearch endpoint (note that this endpoint requires username/password parameters as HTTP Basic Authentication).

### Display help

You can display help about each command with `clever help`.

```
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
