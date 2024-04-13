# Clever Cloud Applications: deployment and lifecycle

A Clever Cloud application can easily be deployed and accessed once created, through following commands. Each can target a specific application in the current folder, adding `[--alias, -a] ALIAS`.

## deploy | cancel

Once changes are committed in your local git repository, you can deploy it:

```
clever deploy
```

It will `git push` your code on the remote repository of your application on Clever Cloud automatically. You can, of course, use option to `force push` or use specific local branch for example:

```
[--branch, -b] BRANCH                             Branch to push (current branch by default) (default: )
[--tag, -t] TAG                                   Tag to push (none by default) (default: )
[--quiet, -q]                                     Don't show logs during deployment (default: false)
[--force, -f]                                     Force deploy even if it's not fast-forwardable (default: false)
[--follow]                                        Continue to follow logs after deployment has ended (default: false)
[--same-commit-policy, -p] SAME-COMMIT-POLICY     Which policy to apply when the local commit is the same as the remote one. Available policies are (error, ignore, restart, rebuild) (default: error)
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
```

## restart

Once deployed, an application can be restarted:

```
clever restart
```

By default, it will use its build cache when available. But you can override it or use other available options:

```
[--commit] COMMIT ID       Restart the application with a specific commit id
[--without-cache]          Restart the application without using cache (default: false)
[--quiet, -q]              Don't show logs during deployment (default: false)
[--follow]                 Continue to follow logs after deployment has ended (default: false)
```

## ssh

A Clever Cloud application is a running virtual machine you can ssh to, as a user (`bas`). By default, it will use `OpenSSH` configuration, but you can target a specific identity file:

```
clever ssh [--identity-file, -i] IDENTITY-FILE
```

## logs

When you deploy an application on Clever Cloud, we collect its logs, hosted in our internal Pulsar stack, all included. To listen to the stream, use:

```
clever logs
```

You can also get logs from a specific timeline, deployment or add-on through options:

```
[--before, --until] BEFORE          Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER            Fetch logs after this date/time (ISO8601)
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

You can also get access logs from a specific timeline or add-on through options, in multiple formats:

```
[--format, -F] FORMAT          Output format (human, json, simple, extended, clf) (default: human)
[--before, --until] BEFORE          Fetch logs before this date/time (ISO8601 date, positive number in seconds or duration, e.g.: 1h)
[--after, --since] AFTER       Fetch logs after this date (ISO8601)
[--follow, -f]                 Display access logs continuously (ignores before/until, after/since) (default: false)
[--addon] ADDON_ID             Add-on ID
```

## activity

To get deployment activity, use:

```
clever activity
```

By default, it will show you last 10 deployments. You can show all or listen to a stream of incoming deployments through options:

```
[--follow, -f]             Track new deployments in activity list (default: false)
[--show-all]               Show all activity (default: false)
```
