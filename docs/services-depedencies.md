# Clever Cloud Services dependencies

On Clever Cloud, applications can expose configuration to share environment variables with other services within the same account/organisation. Add-ons are preconfigured with an exposed configuration. Thus, when they're linked to an application, they automatically share credentials or important variables needed to configure and use them.

Following commands help you with that. Each can target a specific application, adding `--app APP_ID_OR_NAME` or a local alias (`--alias`, `-a`).

## published-config

To list exposed configuration, use:

```
clever published-config
clever published-config --F json
clever published-config --format shell
```

To configure exposed configuration, use:

```
clever published-config COMMAND
```

Available commands are `set`, `rm` (remove) or `import`. The latter reads data from `stdin` so use it as is:

```
clever published-config import < file.config
```

## service

To list services dependencies, use:

```
clever service
clever service --format json
```

You can filter results through these options.

```
[--only-apps]              Only show app dependencies (default: false)
[--only-addons]            Only show add-on dependencies (default: false)
[--show-all]               Show all available add-ons and applications (default: false)
```

To create or delete services dependencies, use:

```
clever service COMMAND ADDON_OR_APP_ID
clever service COMMAND ADDON_OR_APP_NAME
```

Available commands are:

```
link-app                   Add an existing app as a dependency
unlink-app                 Remove an app from the dependencies
link-addon                 Link an existing add-on to this application
unlink-addon               Unlink an add-on from this application
```
