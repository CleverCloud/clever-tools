# clever-tools reference

This directory contains the documentation for all `clever` CLI commands.

## ⚙️ Global options

These options are available for all commands:

|Name|Description|
|---|---|
|`--color`|Choose whether to print colors or not. You can also use --no-color|
|`-v`, `--verbose`|Verbose output|
|`--update-notifier`|Choose whether to use update notifier or not. You can also use --no-update-notifier|

## ➡️ Commands

|Command|Description|
|---|---|
|[`clever accesslogs`](./accesslogs/accesslogs.docs.md)|Fetch access logs|
|[`clever activity`](./activity/activity.docs.md)|Show last deployments of an application|
|[`clever addon`](./addon/addon.docs.md)|Manage add-ons|
|[`clever applications`](./applications/applications.docs.md)|List linked applications|
|[`clever cancel-deploy`](./cancel-deploy/cancel-deploy.docs.md)|Cancel an ongoing deployment|
|[`clever config`](./config/config.docs.md)|Display or edit the configuration of your application|
|[`clever config-provider`](./config-provider/config-provider.docs.md)|Manage configuration providers|
|[`clever console`](./console/console.docs.md)|Open an application in the Console|
|[`clever create`](./create/create.docs.md)|Create an application|
|[`clever curl`](./curl/curl.docs.md)|Query Clever Cloud's API using Clever Tools credentials|
|[`clever database`](./database/database.docs.md)|Manage databases and backups|
|[`clever delete`](./delete/delete.docs.md)|Delete an application|
|[`clever deploy`](./deploy/deploy.docs.md)|Deploy an application|
|[`clever diag`](./diag/diag.docs.md)|Diagnose the current installation (prints various informations for support)|
|[`clever domain`](./domain/domain.docs.md)|Manage domain names for an application|
|[`clever drain`](./drain/drain.docs.md)|Manage drains|
|[`clever emails`](./emails/emails.docs.md)|Manage email addresses of the current user|
|[`clever env`](./env/env.docs.md)|Manage environment variables of an application|
|[`clever features`](./features/features.docs.md)|Manage Clever Tools experimental features|
|[`clever help`](./help/help.docs.md)|Display help about the Clever Cloud CLI|
|[`clever k8s`](./k8s/k8s.docs.md)|Manage Kubernetes clusters|
|[`clever keycloak`](./keycloak/keycloak.docs.md)|Manage Clever Cloud Keycloak services|
|[`clever kv`](./kv/kv.docs.md)|Send a raw command to a Materia KV or Redis® add-on|
|[`clever link`](./link/link.docs.md)|Link this repo to an existing application|
|[`clever login`](./login/login.docs.md)|Login to Clever Cloud|
|[`clever logout`](./logout/logout.docs.md)|Logout from Clever Cloud|
|[`clever logs`](./logs/logs.docs.md)|Fetch application logs, continuously|
|[`clever make-default`](./make-default/make-default.docs.md)|Make a linked application the default one|
|[`clever matomo`](./matomo/matomo.docs.md)|Manage Clever Cloud Matomo services|
|[`clever metabase`](./metabase/metabase.docs.md)|Manage Clever Cloud Metabase services|
|[`clever ng`](./ng/ng.docs.md)|List Network Groups|
|[`clever notify-email`](./notify-email/notify-email.docs.md)|Manage email notifications|
|[`clever open`](./open/open.docs.md)|Open an application in the Console|
|[`clever otoroshi`](./otoroshi/otoroshi.docs.md)|Manage Clever Cloud Otoroshi services|
|[`clever profile`](./profile/profile.docs.md)|Display the profile of the current user|
|[`clever published-config`](./published-config/published-config.docs.md)|Manage the configuration made available to other applications by this application|
|[`clever restart`](./restart/restart.docs.md)|Start or restart an application|
|[`clever scale`](./scale/scale.docs.md)|Change scalability of an application|
|[`clever service`](./service/service.docs.md)|Manage service dependencies|
|[`clever ssh`](./ssh/ssh.docs.md)|Connect to running instances through SSH|
|[`clever ssh-keys`](./ssh-keys/ssh-keys.docs.md)|Manage SSH keys of the current user|
|[`clever status`](./status/status.docs.md)|See the status of an application|
|[`clever stop`](./stop/stop.docs.md)|Stop a running application|
|[`clever tcp-redirs`](./tcp-redirs/tcp-redirs.docs.md)|Control the TCP redirections from reverse proxies to your application|
|[`clever tokens`](./tokens/tokens.docs.md)|Manage API tokens to query Clever Cloud API from https://api-bridge.clever-cloud.com|
|[`clever unlink`](./unlink/unlink.docs.md)|Unlink this repo from an existing application|
|[`clever version`](./version/version.docs.md)|Display the clever-tools version|
|[`clever webhooks`](./webhooks/webhooks.docs.md)|Manage webhooks|
