# How to use Clever Tools

Clever Tools is the command line interface (CLI) of Clever Cloud. You can use it to create and manage multiple services of the platform as applications, databases or storage add-ons. It also provides easy authenticated access to Clever Cloud public APIv2 and APIv4 through the [`clever curl` command](#curl).

It's an [easy to set up](/docs/setup-systems.md) multiplatform and open source tool, based on Node.js. You can contribute to it through
[issue](https://github.com/CleverCloud/clever-tools/issues) or [pull requests](https://github.com/CleverCloud/clever-tools/pulls). You're free
to ask for new features, enhancements or help us to provide them to our community.

- [How to install Clever Tools](/docs/setup-systems.md)
- [Create a Clever Cloud account](https://console.clever-cloud.com)

You'll find below the first commands to know to connect Clever Tools to your account, get its information and manage some options. Others are developed in dedicated pages:

- [Materia KV](/docs/kv.md)
- [Applications: configuration](/docs/applications-config.md)
- [Applications: management](/docs/applications-management.md)
- [Applications: deployment and lifecycle](/docs/applications-deployment-lifecycle.md)
- [Add-ons: management and backups](/docs/addons-backups.md)
- [Services: dependencies](/docs/services-depedencies.md)
- [Services: logs drains](/docs/services-logs-drains.md)
- [Services: notifications and webhooks](/docs/services-notifications-webhooks.md)

## basic commands

To show Clever tools available commands, use:

```
clever
clever help
```

For each of them, you can add these parameters:

```
[--help, -?]            Display help about this program (default: false)
[--version, -V]         Display the version of this program (default: false)
[--color]               Choose whether to print colors or not. You can also use --no-color (default: true)
[--update-notifier]     Choose whether to use update notifier or not. You can also use --no-update-notifier (default: true)
[--verbose, -v]         Verbose output (default: false)
```

> [!TIP]
> For commands returning a list of items, you can use `--format json` or `-F json` to get a JSON output.

## diag | version

To check the current version or get information about your setup, use:

```
clever version
clever diag
clever diag --format json
```

> [!NOTE]
> Such information are nice to provide in your issues report or when you contact Clever Cloud technical support team.

## login | logout

To connect to your Clever Cloud account, use:

```
clever login
```

It will open your default browser and start an Open Authorization ([OAuth](https://en.wikipedia.org/wiki/OAuth)) process to get a `token` and `secret` pair added in your account if it succeeds. You can manage it from the [Console](https://console.clever-cloud.com/users/me/tokens). Clever Tools will automatically store these `token` and `secret` values in a hidden `clever-tools.json` config file in the current local user home folder.

If you already know them, you can use:

```
clever login --secret SECRET --token TOKEN
```

> [!TIP]
> If environment variables `CC_SECRET` and `CC_TOKEN` are set, Clever Tools will use them, `login` is not needed.

To log out, delete this file or use:

```
clever logout
```

## profile

To get information about the current logged-in user (ID, name, email, 2FA activation, etc.), use:

```
clever profile
clever profile open
clever profile -F json
```

## curl

To use our public API, you need to be authenticated for most endpoints. If you're logged in through Clever Tools, there is a simple way to make any request you want: `clever curl`. It's `curl`, but in an authenticated context for Clever Cloud API.

- [Clever Cloud public APIv2 documentation](https://www.clever-cloud.com/developers/api/v2/)
- [Clever Cloud public APIv4 documentation](https://www.clever-cloud.com/developers/api/v4/)
