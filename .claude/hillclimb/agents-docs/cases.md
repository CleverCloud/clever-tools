# Eval `agents-docs`: l'agent charge-t-il les bons docs/contributing depuis AGENTS.md ?

25 cas : 22 tirés de commits réels `feat(...)` du dépôt, plus 3 témoins sans doc requis (`c01` à `c03`). Chaque cas est rejoué sur le parent du commit (archive sans historique), avec `AGENTS.md`, `docs/` et `.claude/` du HEAD superposés.

Le prompt est écrit comme un ticket : symptôme ou demande, sans nom de fichier ni de doc.

Source de l'attendu : table `Load on demand` de `AGENTS.md` (écrite par le mainteneur), croisée avec les fichiers réellement touchés par le commit d'origine.

- `required` (dur) : docs à avoir lus avant la 1re édition
- `soft` : docs utiles, mesurés à part, jamais bloquants

Règle commune : tout cas "commande / option / argument" exige `docs/contributing/commands.md`. `api-client.md` s'ajoute si le commit d'origine ajoute ou change un endpoint dans `src/clever-client/`. Soft : `code-style.md`, `docs-generation.md`, et le guide utilisateur `docs/*.md` quand le commit d'origine le modifie.

| id | commit | tags | required | soft |
|---|---|---|---|---|
| n01 | efb6fc13 | new-command, drain, api-endpoint | commands, api-client | code-style, docs-generation |
| n02 | 928edf95 | new-command, instances | commands | code-style, docs-generation |
| n03 | 90413def | new-command, k8s | commands | code-style, docs-generation |
| n04 | 52d5f3a3 | new-command, k8s | commands | code-style, docs-generation |
| n05 | c0ec4b90 | new-command, k8s | commands | code-style, docs-generation |
| n06 | d101ced6 | new-command, k8s, nested | commands | code-style, docs-generation |
| n07 | 3a7e0d5a | new-command, k8s, nested, shared-args | commands | code-style, docs-generation |
| n08 | 13ae1476 | new-command, oauth-consumers, shared-args | commands | code-style, docs-generation |
| n09 | 80ee4f81 | new-command, otoroshi | commands | code-style, docs-generation |
| e01 | 8fa9afc2 | extend-command, drain | commands | code-style, docs-generation |
| e02 | 764b5b0f | extend-command, ssh | commands | code-style, docs-generation |
| e03 | bf1f1990 | extend-command, ssh | commands | code-style, docs-generation |
| e04 | 4e40c24f | extend-command, drain | commands | code-style, docs-generation |
| e05 | 1617f8bb | extend-command, addon | commands | code-style, docs-generation |
| e06 | e058a47e | extend-command, addon | commands | code-style, docs-generation |
| e07 | e03443c4 | extend-command, parser, user-guide | commands | code-style, docs-generation, user guide |
| e08 | 8502e02b | extend-command, ssh | commands | code-style, docs-generation |
| e09 | 2ab3fede | extend-command, drain, user-guide | commands | code-style, docs-generation, user guide |
| e10 | 8fa1205c | extend-command, k8s, api-endpoint | commands, api-client | code-style, docs-generation |
| e11 | f4f524b7 | extend-command, accesslogs | commands | code-style, docs-generation |
| e12 | 3ceced38 | extend-command, drain, user-guide | commands | code-style, docs-generation, user guide |
| e13 | 856af7c0 | extend-command, drain | commands | code-style, docs-generation |
| c01 | n/a | control, question | none (forbidden: any docs/contributing/*.md) | none |
| c02 | n/a | control, question | none (forbidden: any docs/contributing/*.md except codebase-map) | none |
| c03 | n/a | control, question | none (forbidden: any docs/contributing/*.md except codebase-map) | none |

Témoins : questions de lecture de code, répondables via `AGENTS.md` ou `grep`. Réussite = zéro lecture de `docs/contributing/*.md`. Exception pour `c02` et `c03` (questions de localisation) : `codebase-map.md` est toléré, signalé à part dans `soft`. Ils vérifient que l'agent ne charge pas tous les docs par défaut. Pas de commit d'origine, pas de parent : le cas tourne sur l'archive du HEAD.

## Prompts

### n01

````
Add a `clever drain check` command that tests a drain recipient (URL and credentials) against the Clever Cloud API before the user creates the drain.
````

### n02

````
Add a top-level `clever instances` command that lists the instances of an application, with a human readable table and `--format json`. It targets the app like the other commands (`--app` / `--alias`).
````

### n03

````
Add `clever k8s quota` to show the resource quotas of a Kubernetes cluster.
````

### n04

````
Add `clever k8s activity` to list the recent activity of a Kubernetes cluster.
````

### n05

````
Add `clever k8s update` to change the settings of an existing Kubernetes cluster.
````

### n06

````
Add a `clever k8s version` group with a `check` subcommand (is a newer Kubernetes version available?) and an `update` subcommand (upgrade the version of the cluster).
````

### n07

````
Add `clever k8s nodegroups` with create, list, get, update and delete subcommands to manage the node groups of a cluster.
````

### n08

````
Add a `clever oauth-consumers` command group: list, get, create, update, delete and open (opens the consumer in the Console).
````

### n09

````
Add a `clever otoroshi open swaggerui` subcommand that opens the Swagger UI of an Otoroshi instance in the browser.
````

### e01

````
Users cannot create access logs drains. Add a `--kind` option to the `clever drain create` subcommands.
````

### e02

````
Add an `--instance` option to `clever ssh` to connect to a given running instance by its ID.
````

### e03

````
Add a `--command` option to `clever ssh` to run a remote command instead of opening an interactive shell.
````

### e04

````
Drain commands only work on applications. Add an `--addon` option to target the drains of an add-on.
````

### e05

````
Add an `--org` option to `clever addon providers show`.
````

### e06

````
Add an `--org` option to `clever addon providers`.
````

### e07

````
The date options of the log commands should accept the value `now`.
````

### e08

````
In `clever ssh`, let the user pick an instance by its number in the list, or with `any`.
````

### e09

````
Add a `--type` option to `clever drain` to only list the drains of a given recipient type.
````

### e10

````
`clever k8s create` is too limited. Add options for topology, flavor, version, autoscaling, storage and an initial node group.
````

### e11

````
`clever accesslogs` should offer the Common Log Format as an output format again.
````

### e12

````
Support Splunk HEC as a drain target of `clever drain create`.
````

### e13

````
Support Better Stack as a drain target of `clever drain create`.
````

### c01

````
Which Node.js version does this project target, and where is it pinned?
````

### c02

````
In which file are the OAuth consumer key and secret used by the CLI defined?
````

### c03

````
How many root commands does `src/commands/global.commands.js` register? Just give the number.
````
