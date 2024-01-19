# Clever Cloud Add-ons: management and backups

Add-ons on Clever Cloud are databases, storage services, tools or third party services you can enable through ` clever addon provider`. For each of the folowing commands, you can target a specific user/organisation:

```
[--org, -o, --owner]                Organisation ID (or name, if unambiguous)
```

## providers

To use add-ons, you need to identify the corresponding provider. To get informations about them (plans, regions, versions), use:

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
[--plan, -p] PLAN                   Add-on plan, depends on the provider (default: dev)
[--region, -r] REGION               Region to provision the add-on in, depends on the provider (default: par)
[--addon-version] ADDON-VERSION     The version to use for the add-on
[--option] OPTION                   Option to enable for the add-on. Multiple --option argument can be passed to enable multiple options
```

To rename an add-on, use:

```
clever addon rename ADDON_ID_OR_NAME ADDON_NEW_NAME
```

To delete an add-on, use:

```
clever addon delete [--yes, -y] ADDON_ID_OR_NAME
```

## env

Each add-on comes with environement variables. To get them, use:

```
clever addon env [--format, -F] FORMAT ADDON_ID
```

> [!NOTE] 
> Available formats are: `human` (default), `json` and `shell`

## database backups

Databases are backup every day, with last 7 days of backups available to download. To get these files, use:

```
clever database backups download [--output, --out] OUTPUT_FILE DATABASE_ID BACKUP_ID
```

This command is still under development and will evolve over time. To get informations about backups and download them, you can use our API and `clever curl`. For example:

```
clever curl -X GET https://api.clever-cloud.com/v2/backups/<USER_ORG_ID>/<DATABASE_ID>
```

This will list available backups for the database, with creation and delete time. The anwser will also contains a direct HTTPS `download_url`.
