---
name: clever-tools
description: CLI to deploy and manage applications, add-ons, and configurations on Clever Cloud PaaS. Use when the user needs to deploy apps, view logs, manage environment variables, configure domains, or interact with Clever Cloud services.
license: Apache-2.0
metadata:
  author: CleverCloud
---

# Clever Tools

Clever Tools is the official CLI for Clever Cloud, a Platform-as-a-Service (PaaS) provider. It allows you to deploy applications, manage add-ons (databases, storage, etc.), configure environment variables, domains, and monitor your services.

Use this skill when the user wants to deploy code to Clever Cloud, manage their hosted applications, or interact with Clever Cloud services.

Use the latest version of Clever Tools, older ones have bugs fixed since. Compare `clever version` with the latest release (for example `npm view clever-tools version`) and update it with the package manager it was installed with, see [How to update Clever Tools](https://github.com/CleverCloud/clever-tools/blob/master/docs/update.md). The update notice is not shown when the output is not a terminal, as in most agent shells.

This skill shows the most common commands only. Before using a command, run it with `--help` (for example `clever env set --help`) to get its arguments and options.

## Quick Start

```bash
# Check whether you are already logged in, and with which account
clever profile

# List the configured profiles, switch to another one
# (never switch profiles without the user's explicit agreement)
clever profile list
clever profile switch --alias <alias>

# Login to Clever Cloud (opens a browser: from an agent, ask the user to run it)
clever login

# For CI/CD, use token-based authentication
export CLEVER_TOKEN="your-token"
export CLEVER_SECRET="your-secret"

# Link an existing application to current directory
clever link <app-id>

# Or create a new application
clever create --type node myapp

# Deploy current directory
clever deploy
```

## Essential Commands

### Deployment

```bash
# Deploy the last commit of the current branch (git push, uncommitted changes are not sent),
# then wait for the end of the deployment (same for `clever restart`)
clever deploy

# Deploy a specific branch
clever deploy --branch main

# Redeploy when this commit is already pushed (fails by default)
clever deploy --same-commit-policy restart

# Redeploy a specific commit already pushed (`clever deploy` has no `--commit` option)
clever restart --commit <commit-id>

# Restart application
clever restart

# Stop application (scales to 0)
clever stop

# Check deployment status
clever status

# View deployment history
clever activity
clever activity --follow  # Live updates
```

### Logs

```bash
# Stream live logs (keeps running until interrupted)
clever logs

# View logs from last hour, then exit
clever logs --since 1h --until now

# View logs before a specific time
clever logs --before 2024-01-15T10:00:00

# Filter by deployment
clever logs --deployment-id <id>

# Access logs (HTTP requests)
clever accesslogs
clever accesslogs --since 1h
```

### Environment Variables

```bash
# List all environment variables
clever env

# Set a variable
clever env set MY_VAR "my value"

# Set several variables: one `clever env set` per variable
clever env set VAR1 "value1"
clever env set VAR2 "value2"

# Remove a variable
clever env rm MY_VAR

# Replace all the application's variables with a .env file (read from STDIN):
# variables missing from the file are deleted, add-on variables are kept
clever env import < .env

# Changes apply on the next deployment
clever restart

# A restart can reuse the build cache: rebuild when the build reads the changed
# variable (build command, variables embedded in front-end assets…)
clever restart --without-cache

# Export for shell
clever env --format shell > .env
```

### Domains

```bash
# List domains
clever domain

# Add a custom domain
clever domain add myapp.example.com

# Remove a domain
clever domain rm myapp.example.com

# Favorite domain (used in logs, URLs)
clever domain favorite set myapp.example.com
```

### Add-ons (Databases, Storage, etc.)

```bash
# List your add-ons
clever addon

# List available add-on providers
clever addon providers

# Create a PostgreSQL database
clever addon create postgresql-addon mydb --plan dev

# Create Redis
clever addon create redis-addon myredis --plan s_mono

# Create S3-compatible storage (Cellar)
clever addon create cellar-addon mybucket

# Delete an add-on
clever addon delete <addon-id>

# Get add-on environment variables
clever addon env <addon-id>
```

### Services (Managed services like Keycloak, Matomo)

```bash
# Link add-on to application
clever service link-addon <addon-id>

# Unlink add-on
clever service unlink-addon <addon-id>
```

### Scaling

```bash
# View current scaling
clever scale

# Set instance size (flavor)
clever scale --flavor M

# Set number of instances
clever scale --instances 2

# Autoscaling
clever scale --min-instances 1 --max-instances 4
```

### SSH Access

```bash
# SSH into running instance
clever ssh

# Run a command
clever ssh --command "ls -la"
```

### Applications Management

```bash
# List all applications in organization
clever applications list

# List linked applications in current directory
clever applications

# Create new application
clever create --type <type> <name>
# Types: node, python, ruby, php, java, go, rust, docker, static...

# Delete application
clever delete
```

## Using from an Agent or a Script

Some commands open a browser, ask for a confirmation or print secrets. From an agent or a script:

- **Confirmations**: add `--yes` to `clever addon create` (paid plans), `clever addon delete` and `clever delete`, once the user has agreed.
- **Secrets**: `clever env`, `clever addon env`, `clever profile` and `clever profile list` can print secrets (passwords, API keys, an OAuth consumer secret set with `clever login --oauth-consumer-secret`). Run them only when needed, and never copy their output into an issue, a pull request or a commit.
- **Check the result**: `clever open` and `clever console` open a browser, on the application and on its Console page. Get the URL with `clever domain` instead, then query it, for example with `curl -i https://<domain>/`.

## Runtime Contract and Troubleshooting

- If the application starts its own HTTP server, it must listen on `0.0.0.0`, not on `localhost`, and on port `8080`, given by the `PORT` environment variable. Behind a [Request Flow](https://www.clever.cloud/developers/doc/develop/request-flow/#port-management) middleware (Varnish, Redirection.io…), it must listen on `9000` instead: set `PORT=9000`. Runtimes that run the web server for you (PHP, static, Java WAR…) handle this, and Docker uses `CC_DOCKER_EXPOSED_HTTP_PORT`.
- Linked add-ons inject their own variables, such as `POSTGRESQL_ADDON_URI`, `MYSQL_ADDON_URI` or `REDIS_URL`: check them with `clever env`. If the code expects another name, don't copy the value into a new variable, it would not follow changes on the add-on side. Read the add-on variable when the application starts, in the code or the start command (in Node.js, for example, `process.env.DATABASE_URL || process.env.POSTGRESQL_ADDON_URI`). If Mise launches the application, through a Mise task, `mise exec --` in `CC_RUN_COMMAND`, or a tool called through its shim on `PATH` (such as `node` installed through `[tools]`), the `[env]` section of a `mise.toml` file can map it: `DATABASE_URL = "{{ env.POSTGRESQL_ADDON_URI }}"` (see [Mise](https://www.clever.cloud/developers/doc/develop/mise/#shape-the-environment)).

When a deployment fails, `clever activity` shows it, and `clever logs --deployment-id <id> --until now` gives its logs. Look for the error above `Deploy failed in … Please review the lines above to find out why`. A health check error is a symptom: the cause is in the lines above it. Common cases, to confirm before changing anything:

| What the logs show | Possible cause | Check, then fix |
|---|---|---|
| `Your application is not listening on 8080`, with `Killed` above and no stack trace | The instance ran out of memory | Memory used at startup, then `clever scale --flavor <bigger>` if needed |
| `Your application is not listening on 8080`, the application says it listens on another port | Wrong port | Listen on `PORT` (see above) |
| `Your application is not listening on 8080`, with a stack trace above | Crash at startup, such as a missing environment variable | `clever env`, then `clever env set <NAME> <value>` and `clever restart` |
| `Your application is listening on localhost instead of publicly` | Wrong host | Listen on `0.0.0.0` |
| `Some software are not listening as expected: 9000` | Request Flow middleware enabled, application not listening on `9000` | Startup logs and expected port; for a server the application starts itself, set `PORT=9000` if needed (see above) |
| `Response from GET / is 500` or `Failed to connect to …`, then `Error while checking /` | The HTTP health check gets an error response (500 or more) or cannot connect | The stack trace in the logs |

If the logs are not enough, set `CC_TROUBLESHOOT` to `true` and redeploy: after a failure, the instance stays up so you can inspect it with `clever ssh`, unless the logs say the failure came too early for it. Some runtimes also print more build details. Remove the variable once done.

## Common Global Options

These options work with most commands:

```bash
--app <app-id|name>      # Target specific app (when multiple linked)
--alias <alias>          # Use app alias (from clever link --alias)
--org <org-id|name>      # Target specific organization
-F, --format <format>    # Output format: human, json, json-stream, shell
-y, --yes                # Skip confirmation prompts
```

JSON output is useful for scripting:
```bash
clever env --format json | jq '.MY_VAR'
clever applications list --format json
```

## Full Reference

For complete documentation of all commands, options, available runtimes, add-on providers, and deployment zones, see [references/full-documentation.md](references/full-documentation.md).
