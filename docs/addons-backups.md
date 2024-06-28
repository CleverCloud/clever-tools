# Clever Cloud Add-ons: management and backups

Add-ons on Clever Cloud are databases, storage services, tools or third party services you can enable through ` clever addon provider`. For each of the following commands, you can target a specific user/organisation:

```
[--org, -o, --owner]                Organisation ID (or name, if unambiguous)
```

## providers

To use add-ons, you need to identify the corresponding provider. To get information about them (plans, regions, versions), use:

```
clever addon providers
clever addon providers show PROVIDER_NAME
```

## create | rename | delete

To create an add-on, select a provider and choose a name:

```
clever addon create PROVIDER ADDON_NAME
```

You can set `plan`, `region`, `version`, `option` and directly `link` an add-on to an application through these parameters:

```
[--link, -l] ALIAS                  Link the created add-on to the app with the specified alias
[--yes, -y]                         Skip confirmation even if the add-on is not free (default: false)
[--plan, -p] PLAN                   Add-on plan, depends on the provider
[--region, -r] REGION               Region to provision the add-on in, depends on the provider (default: par)
[--addon-version] ADDON-VERSION     The version to use for the add-on
[--option] OPTION                   Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
[--format, -F] FORMAT               Output format (human, json) (default: human)
```

> [!NOTE]
> If no plan is set, we use the cheapest by default

To rename an add-on, use:

```
clever addon rename ADDON_ID_OR_NAME ADDON_NEW_NAME
```

To delete an add-on, use:

```
clever addon delete [--yes, -y] ADDON_ID_OR_NAME
```

## env

Each add-on comes with environment variables. To get them, use:

```
clever addon env [--format, -F] FORMAT ADDON_ID
```

> [!NOTE]
> Available formats are: `human` (default), `json` and `shell`

If you're testing [Materia KV](https://developers.clever-cloud.com/doc/addons/materia-kv/), our next generation of serverless distributed database, synchronously-replicated, compatible with Redis protocol, you can create an add-on and immediately use it:

```
clever addon create kv ADDON_NAME
source <(clever addon env ADDON_ID --format shell)
redis-cli -h $KV_HOST -p $KV_PORT --tls
```

> [!TIP]
> If you use the Fish shell, you can use the following command to set the environment variables:
> ```
> clever addon env ADDON_ID --format shell | source
> ```

## database backups

Databases are backup every day, with last 7 days of backups available to download. You can list them, available formats are: `human` (default) or `json`:

```
clever database backups DATABASE-ID [--format, -F] FORMAT
```

To download one of them, use:

```
clever database backups download [--output, --out] OUTPUT_FILE DATABASE_ID BACKUP_ID
```

This command is still under development and will evolve over time. To get information about backups and download them, you can use our API and `clever curl`. For example:

```
clever curl -X GET https://api.clever-cloud.com/v2/backups/<USER_ORG_ID>/<DATABASE_ID>
```

This will list available backups for the database, with creation and delete time. The answer will also contain a direct HTTPS `download_url`.
