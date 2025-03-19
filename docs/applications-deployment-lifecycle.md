# Clever Cloud Applications: deployment and lifecycle

A Clever Cloud application can easily be deployed and accessed once created, through following commands. Most can target a specific application, adding `--app APP_ID_OR_NAME` or a local alias (`--alias`, `-a`).

## deploy

Once changes are committed in your local git repository, you can deploy it:

```
clever deploy
```

It will `git push` your code on the remote repository of your application on Clever Cloud automatically. You can, of course, use option to `force push` or use specific local branch for example:

```
[--branch, -b] BRANCH                 Branch to push (current branch by default) (default: )
[--tag, -t] TAG                       Tag to push (none by default) (default: )
[--quiet, -q]                         Don't show logs during deployment (default: false)
[--force, -f]                         Force deploy even if it's not fast-forwardable (default: false)
[--follow]                            Continue to follow logs after deployment has ended (default: false)
[--same-commit-policy, -p] POLICY     What to do when local and remote commit are identical (error, ignore, restart, rebuild) (default: error)
[--exit-on, -e] STEP                  Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
```

> [!TIP]
> You can cancel a deployment with `clever cancel-deploy` command. You can also [configure an application](applications-config.md#config) so that a new deployment cancels the current one.

## console | open

Once deployed, you can open the application on your default browser or [Clever Cloud Console](https://console.clever-cloud.com):

```
clever open
clever console
```

## status

To get application state, options or running/scaling status, use:

```
clever status
clever status --format json
```

## restart

Once deployed, an application can be restarted:

```
clever restart
```

By default, it will use its build cache when available. But you can override it or use other available options:

```
[--commit] COMMIT ID       Restart the application with a specific commit ID
[--without-cache]          Restart the application without using cache (default: false)
[--quiet, -q]              Don't show logs during deployment (default: false)
[--follow]                 Continue to follow logs after deployment has ended (default: false)
[--exit-on, -e] STEP       Step at which the logs streaming is ended, steps are: deploy-start, deploy-end, never (default: deploy-end)
```

## stop | cancel-deploy

To stop an application or cancel any ongoing deployment, use:

```
clever stop
clever cancel-deploy
```

## ssh

A Clever Cloud application is a running virtual machine you can ssh to, as a user (`bas`). By default, it will use `OpenSSH` configuration, but you can target a specific identity file:

```
clever ssh [--identity-file, -i] IDENTITY-FILE
```

To ssh a specific application, use:

```
clever ssh --app APP_ID_OR_NAME
```

## logs

When you deploy an application on Clever Cloud, we collect its logs, hosted in our internal Pulsar stack, all included. To listen to the stream, use:

```
clever logs
```

You can also get logs from a specific timeline, deployment or add-on through options:

```
[--before, --until] BEFORE          Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER            Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--search] SEARCH                   Fetch logs matching this pattern
[--deployment-id] DEPLOYMENT_ID     Fetch logs for a given deployment
[--addon] ADDON_ID                  Add-on ID
[--format, -F] FORMAT               Output format (human, json, json-stream) (default: human)
```

## access logs

When you deploy an application on Clever Cloud, we collect its access logs, hosted in our internal Pulsar stack, all included. To listen to the stream, use:

```
clever accesslogs
```

> [!TIP]
>  This now uses our v4 API, it's available as Alpha feature for now.

You can also get access logs from a specific timeline or add-on through options, in multiple formats:

```
[--before, --until] BEFORE     Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER       Fetch logs after this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--format, -F] FORMAT          Output format (human, json, json-stream) (default: human)
```
You can for example get access logs in JSON stream format for the last hour with:

```
clever accesslogs --format json-stream --since 1h
clever accesslogs -F json-stream | jq '.source.ip'
```

or JSON if you add a date/time end limit:

```
clever accesslogs --app APP_NAME --since 2025-04-21T13:37:42 --until 1d -F json | jq '[.[] | {date, countryCode: .source.countryCode, ip: .source.ip, port: .source.port}]'
clever accesslogs --app APP_NAME --since 2025-04-21T13:37:42 --until 1d -F json | jq '.[] | [.date, .source.countryCode, .source.ip, .source.port] | @sh'
```

> [!TIP]
> `jq` offers multiple table formatting options, like `@csv`, `@tsv`, `@json`, `@html`, `@uri`, `@base64`, etc.

## activity

To get deployment activity, use:

```
clever activity
```

By default, it will show you last 10 deployments. You can show all or listen to a stream of incoming deployments through options:

```
[--follow, -f]             Track new deployments in activity list (default: false)
[--show-all]               Show all activity (default: false)
[--format, -F] FORMAT      Output format (human, json, json-stream)
```
