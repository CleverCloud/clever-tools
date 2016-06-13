clever-tools
============

Command Line Interface for Clever Cloud.

## Installation

```
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

### Create an application

```
clever create <name> --type <type> \
  [-region <region>] \
  [-orga <organisation>] \
  [-alias <alias>]
```

Where `type` is one of:

 - `php`: for PHP applications
 - `docker`: for Docker-based applications
 - `go`: for Go applications
 - `java+maven`: for standalone java applications
 - `java+play1`: for Play1 applications
 - `java+war`: for java applications deployed in an application server
 - `node`: for node.js applications
 - `python27`: for python27 applications
 - `ruby`: for ruby applications
 - `sbt`: for applications build with SBT (java, scala, Play2)
 - `static`: for static (HTML only) websites

Where region is one of:

 - `par` (for Paris)
 - `mtl` (for Montreal)

`--organisation` allows you to chose the organisation in which your app is
created.

`--alias` allows you to deploy your application several times on Clever Cloud
(eg: production, testing, …)

### Link an existing application

```
clever link <APP-ID> [--alias <alias>]
```

Where `APP-ID` is the name or id of your application (`application_name` or
`organisation_name/application_name`).

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

### Change application scale

```
clever scale [--alias <alias>] [--min-flavor <minflavor>] [--max-flavor <maxflavor>] [--min-instances <mininstances>] [--max-instances <maxinstances>]
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
