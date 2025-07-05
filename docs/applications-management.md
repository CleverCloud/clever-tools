# Clever Cloud Applications: management

## create

You can create a new application on Clever Cloud, linked to your local folder. Only its `type` is required, it should be one of: `docker`, `elixir`, `frankenphp`, `go`, `gradle`, `haskell`, `jar`, `linux`, `maven`, `meteor`, `node`, `php`, `play1`, `play2`, `python`, `ruby`, `rust`, `sbt`, `static`, `static-apache`, `v` or `war`. Result can be printed in `human` or `json` format.

```
clever create -t TYPE APP_NAME
clever create -t TYPE --format json
```

> [!NOTE]
> Application name is optional. The current directory name is used if not specified.

You can also use one of the following optional parameters:

#### Tasks

```
[--task, -T] COMMAND
```

You can declare a new application as a Clever Task. Once deployed, a Task executes its command and then stops. This value can be set by an (optional) parameter or later through `clever env set CC_RUN_COMMAND command`.

You can execute a Task whenever needed through a `clever restart` or modify it and `clever deploy` a new revision. You'll only be billed for the build/execution time, per second.

> [!NOTE]
> Except its lifecycle, a Clever Task is identical to an application and accepts the same environment variables.

#### GitHub repositories

```
--github owner/repo
```

If your Clever Cloud account is linked to a GitHub account, you can deploy any of your GitHub repositories as an application thanks to this parameter.

#### Other optional parameters

You can ask to deploy your application in a specific organisation/user account, region, with an alias different from its name:

```
[--org, -o, --owner] ID/NAME
[--alias, -a] ALIAS
[--region, -r] ZONE
[--format, -F] FORMAT
```

Default region is our Paris datacenters (`par`), but it can be:

- `par` (Paris, [Clever Cloud](https://www.clever-cloud.com/infrastructure/))
- `parhds` (Paris, HDS infrastructure, [Clever Cloud](https://www.clever-cloud.com/infrastructure/))
- `scw` (Paris, [Scaleway DC5](https://www.clever-cloud.com/blog/press/2023/01/17/clever-cloud-and-scaleway-join-forces-to-unveil-a-sovereign-european-paas-offering/))
- `grahds` (Gravelines, HDS infrastructure, OVHcloud)
- `ldn` (London, Ionos)
- `mtl` (Montreal, OVHcloud)
- `rbx` (Roubaix, OVHcloud)
- `rbxhds` (Roubaix, HDS infrastructure, OVHcloud)
- `sgp` (Singapore, OVHcloud)
- `syd` (Sydney, OVHcloud)
- `wsw` (Warsaw, OVHcloud)

> [!NOTE]
> To benefit from certified hosting for health data, you need to deploy in an HDS zone and to sign up to a specific contract. \
> This begins with [an initial discussion with our team](https://www.clever-cloud.com/fr/hebergement-donnees-de-sante/contact-hds/).

After the application creation, you can ask for a `json` formatted report instead of an `human` sentence:

```
[--format, -F] FORMAT
```

## (un)link and make-default

If an application already exists in your Clever Cloud account, you can link it to any local directory to control it easily. You can even link several applications to a single folder, each one with a different name and/or alias. This is done through the `.clever.json` file.

```
clever link APP_ID_OR_NAME [--alias, -a] ALIAS [--org, -o, --owner] ORG_ID_OR_NAME
```

If multiple applications are linked, you can define one as default with it alias:

```
clever make-default ALIAS
```

To unlink an application:

```
clever unlink ALIAS
```

## applications

You can list linked applications of a folder, you'll get : ID, alias and deployment URL.

```
clever applications
```

If you only need to get aliases or the result in the JSON format:

```
[--only-aliases]           List only application aliases (default: false)
[--json, -j]               Show result in JSON format (default: false)
```

## list

To list all applications across all organisations you have access to, you can use:

```
clever applications list -F json
clever applications list --org ORG_ID_OR_NAME
```

## delete

To delete an application and unlink it from the current folder you only need to:

```
clever delete
clever delete --alias ALIAS
clever delete --app APP_ID_OR_NAME
```

> [!TIP]
> You can skip confirmation adding the `--yes` or `-y` parameter.
