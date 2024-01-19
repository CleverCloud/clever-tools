# How to use Clever Tools

Clever Tools is the command line interface (CLI) of Clever Cloud. You can use it to create and manage multiple services of the platform as applications, databases or storage add-ons. It also provides an easy authenticated access to Clever Cloud public APIv2 and APIv4 through the [`clever curl` command](#curl).

It's an [easy to setup](/docs/setup-systems.md) multiplatform and open source tool, based on Node.js. You can contribute to it through
[issue](https://github.com/CleverCloud/clever-tools/issues) or [pull requests](https://github.com/CleverCloud/clever-tools/pulls). You're free
to ask for new features, enhancements or help us to provide them to our community.

- [How to install Clever Tools](/docs/setup-systems.md)
- [Create a Clever Cloud account](https://console.clever-cloud.com)

You'll find below the first commands to know to connect Clever Tools to your account, get its informations and manage some options. Others are developed in dedicated pages:

- [Applications: configuration](/docs/applications-config.md)
- [Applications: management](/docs/applications-management.md)
- [Applications: deployment and lifecycle](/docs/applications-deployment-lifecycle.md)
- [Add-ons: management and backups](/docs/addons-backups.md)
- [Services: depedencies](/docs/services-depedencies.md)
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
[--help, -?]               Display help about this program (default: false)
[--version, -V]            Display the version of this program (default: false)
[--verbose, -v]            Verbose output (default: false)
[--no-update-notifier]     Don't notify available updates for clever-tools (default: false)
```

## diag | version

To check the current version or get informations about your setup, use:

```
clever version
clever diag
```

> [!NOTE]
> Such informations are nice to provide in your issues report or when you contact Clever Cloud technical support team.

## login | logout

To connect to your Clever Cloud account, use:

```
clever login
```

It will open your default browser and start an Open Authorization ([OAuth](https://en.wikipedia.org/wiki/OAuth)) process get a `token` and `secret` pair added in your account if it succeeds. You can manage it from the [Console](https://console.clever-cloud.com/users/me/tokens). Clever Tools will automatically store these `token` and `secret` values in a hidden `clever-tools.json` config file in the current local user home folder.

If you already know them, you can use:

```
clever login --secret SECRET --token TOKEN
```

> [!TIP]
> If environment variables `CC_SECRET` and `CC_TOKEN` are set, Clever Tools will use them, `login` is not needed.

To logout, delete this file or use:

```
clever logout
```

## profile

To get informations about the current logged in user (ID, name, email, 2FA activation), use:

```
clever profile
```

## curl

To use our public API, you need to be authentified on many endpoints. If you're logged in through Clever Tools, there is a simple way to make any request you want: `clever curl`. It's `curl`, you an use exactly the same way as the famous tool, but in an authenticated context for Clever Cloud API.

- [Clever Cloud public APIv2 documentation](https://developers.clever-cloud.com/api/v2/)
- [Clever Cloud public APIv4 documentation](https://developers.clever-cloud.com/api/v4/)
