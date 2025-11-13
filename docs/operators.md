# Clever Cloud Operators

Operators allow you to deploy services as turnkey solutions on Clever Cloud. They provision resources, configure them and expose an API and tools to ease their management during their lifecycle. To add operators commands to Clever Tools, enable the `operators` feature:

```
clever features enable operators
```

Then, you can use the clever commands to manage Keycloak, Matomo, Metabase and Otoroshi instances on Clever Cloud. For example to list them deployed services:

```
clever keycloak
clever matomo
clever metabase
clever otoroshi
```

To get information about a deployed service, use:

```
clever keycloak get myKeycloak
clever matomo get matomo_id --format json
```

>[!TIP]
> You can target a deployed service by its ID or name.

## Service management

To restart or rebuild (restart without cache) a deployed service, use:

```
clever metabase restart myMetabase
clever otoroshi rebuild otoroshi_id
```

To open the deployed service dashboard in Clever Cloud Console, use:

```
clever keycloak open myKeycloak
```

You can also open the service web management interface or logs of the underlying application:

```
clever otoroshi open logs myOtoroshi
clever otoroshi open webui otoroshi_id
```

## Version management

To check the version of a deployed service, use:

```
clever matomo version check matomo_id
clever metabase version check myMetabase --format json
```

To update to a specific version, use:

```
clever keycloak version update myKeycloak 24.0.1
```

To see a list of available versions, don't provide a version number:

```
clever otoroshi version update otoroshi_id
```

## Network Groups

Keycloak and Otoroshi can be easily linked to a [Network Group](ng.md). To enable/disable this feature, use:

```
clever keycloak enable-ng myKeycloak
clever otoroshi disable-ng otoroshi_id
```

>[!INFO]
> On Clever Cloud Keycloak uses Network Groups for its secure cluster feature. When you enable it, the Keycloak application is automatically scaled to 2 instances and the cluster automatically configured. When you disable the Network Group feature, the application is scaled down to 1 instance and the cluster is removed.
```

## Otoroshictl

Otoroshi instances can be managed using the `otoroshictl` command line tool. Clever Tools provides an easy way to use it, by providing Otoroshi instances configuration in a compliant YAML format:

```bash
# Install otoroshictl with Rust's Cargo and enable operators/otoroshi command in Clever Tools:
cargo install otoroshictl
clever features enable operators

clever otoroshi get-config <otoroshi_id_or_name> | otoroshictl config import --current --stdin
otoroshictl resources get routes
```

> [!TIP]
> You can add as many Otoroshi instances as you want to your `otoroshictl` configuration by repeating this command with different instance IDs or names. Just add the `--current` flag to the one you want to use by default.
