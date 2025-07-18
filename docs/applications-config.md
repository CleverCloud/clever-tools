# Clever Cloud Applications: configuration

A Clever Cloud application can easily be configured once created, through following commands. Each can target a specific application, adding `--app APP_ID_OR_NAME` or a local alias (`--alias`, `-a`).

## config

Each application has options you can get/set: `cancel-on-push`, `description`, `force-https`, `name`, `sticky-sessions`, `task`, `zero-downtime`.

```
clever config get parameter
clever config set parameter value
```

To update multiple configuration parameters at a time, use:

```
clever config update FLAGS
```

Available parameters are :

```
[--name]                        Set name
[--description]                 Set description
[--enable-zero-downtime]        Enable zero-downtime (default: false)
[--disable-zero-downtime]       Disable zero-downtime (default: false)
[--enable-sticky-sessions]      Enable sticky-sessions (default: false)
[--disable-sticky-sessions]     Disable sticky-sessions (default: false)
[--enable-cancel-on-push]       Enable cancel-on-push (default: false)
[--disable-cancel-on-push]      Disable cancel-on-push (default: false)
[--enable-force-https]          Enable force-https (default: false)
[--disable-force-https]         Disable force-https (default: false)
[--enable-task]                 Enable task (default: false)
[--disable-task]                Disable task (default: false)
```

## env

Environment variables of Clever Cloud applications can easily be modified:

```
clever env set VARIABLE VALUE
clever env rm VARIABLE
```

You can import local environment variables (comma separated) or from a file through `stdin`. If it's a JSON file, each object should be composed of a `name` and a `value`.

```
clever env import-vars VAR_NAME1,VAR_NAME2
clever env import < .env
cat .env.json | clever env import --json
```

To show or export environment variables of an application, use:

```
clever env
clever env > .env
```

You can also export environment variable in a sourceable format (`export ENV_NAME="VALUE";`):

```
clever env --add-export
```

## domain

By default, a Clever Cloud application gets `app_id.cleverapps.io` as fully qualified domain name ([FQDN](https://fr.wikipedia.org/wiki/Fully_qualified_domain_name)). To see it, use:

```
clever domain
```

To get an overview of domains linked to any of your applications and organisations, use:

```
clever domain overview
clever domain overview --filter domain.tld
clever domain overview --filter .tld --format json
```

> [!TIP]
> The JSON output of this command plays nicely with tools such as [jless](https://jless.io/) to navigate through your domains.

To add/remove a domain to an application, use:

```
add                        Add a domain name to a Clever Cloud application
rm                         Remove a domain name from a Clever Cloud application
```

> [!TIP]
> You can set the same domain with multiple apps thanks to [prefix routing](https://www.clever-cloud.com/developers/doc/administrate/domain-names/#prefix-routing). For example, you can add `mydomain.com/app1` domain to an application and `mydomain.com/app2` to another.

To (un)set the favourite domain, use:

```
clever domain favourite set FQDN
clever domain favourite unset FQDN
```

To check if the domains of an application are properly configured, use:

```
clever domain diag
clever domain diag --format json
clever domain diag --app APP_ID_OR_NAME
```

You can only diagnose some domains of the application using a text filter:

```
clever domain diag --filter .tld
clever domain diag --filter mydomain.tld
```

> [!NOTE]
> Domain diagnosis is not made for applications using a 3rd party CDN or a dedicated load balancer.

## scale and dedicated build

You can easily change the number of instances and `flavor` for an application. It can have a different `flavor` used for build phase, to get it done faster. We also provide horizontal and vertical scaling: you can set a minimal/maximal `flavor` and number of instance, then we autoscale depending on incoming load. To change this, use `clever scale` with the following options:

```
[--flavor] FLAVOR                  The scale of your application
[--min-flavor] MINFLAVOR           The minimum scale for your application
[--max-flavor] MAXFLAVOR           The maximum scale for your application
[--instances] INSTANCES            The number of parallels instances
[--min-instances] MININSTANCES     The minimum number of parallels instances
[--max-instances] MAXINSTANCES     The maximum number of parallels instances
[--build-flavor] BUILDFLAVOR       The size of the build instance, or `disabled`
```

> [!NOTE]
> Available instances flavors are: `pico`, `nano`, `XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`
>
> Due to its low memory (256 MiB) `pico` is not always available. When selected, a dedicated `S` instance is used for build by default.

## tcp-redirs

A Clever Cloud application activate TCP redirections in `default` or `cleverapps` namespace:

```
clever tcp-redirs add --namespace NAMESPACE
clever tcp-redirs remove --namespace NAMESPACE PORT
```

To list enabled TCP redirection, use:

```
clever tcp-redirs
clever tcp-redirs --format json
```

- [Learn more about TCP redirections](https://www.clever-cloud.com/developers/doc/administrate/tcp-redirections/)
