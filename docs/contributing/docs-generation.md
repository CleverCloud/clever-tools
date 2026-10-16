# Documentation generation

The command reference is generated from the command definitions by `npm run docs` (`scripts/generate-docs.js`, with the Markdown logic in `scripts/lib/docs-reference.js` and the skill reference in `scripts/lib/docs-llm.js`). The CI runs `npm run docs:check` on every PR and fails if a generated file is out of date: after changing a command (description, options, arguments, `since`, registration), run `npm run docs` and commit the generated files with the change.

## Generated files

| File | Content | Hand edits |
|---|---|---|
| `src/commands/<command>/<command>.docs.md` | One `##` section per command and subcommand: heading with the `since` badge, description, usage, `### 📥 Arguments` and `### ⚙️ Options` tables | Custom `###` sections are preserved, see below |
| `src/commands/README.md` | Global options and the index of root commands | None, overwritten on each run |
| `skills/clever-tools/references/full-documentation.md` | Reference shipped with the [`clever-tools` skill](../../skills/clever-tools/): every command, plus `docs/setup-systems.md` and the runtimes, add-ons and zones fetched from the public API (`scripts/lib/docs-llm.js`) | None, overwritten on each run |

`skills/clever-tools/SKILL.md` is **not** generated: when a command is added, removed or its usage changes, update it by hand if it mentions the command.

Because of the API data, `npm run docs` and `npm run docs:check` need network, and `docs:check` can fail because the products, runtimes or zones changed rather than because of your change. Running `npm run docs` and committing the result fixes it.

## Adding content to a `*.docs.md` file

Everything in a `*.docs.md` file is rewritten on each run, except the `###` sections you add under a command's `##` heading, other than Arguments and Options. Use them for examples, notes or related commands.

For the fictional `coffee brew` command of [commands.md](commands.md), `src/commands/coffee/coffee.docs.md` contains the section below. Everything but `### Examples` is generated:

````markdown
## ➡️ `clever coffee brew` <kbd>Since 4.12.0</kbd>

Brew a coffee

```bash
clever coffee brew <blend> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`blend`|Blend of coffee|

### ⚙️ Options

|Name|Description|
|---|---|
|`-s`, `--shots` `<shots>`|Number of espresso shots (default: 1)|
|`--milk` `<milk>`|Kind of milk (none, whole, oat) (default: none)|
|`--topping` `<topping>`|Topping to add. Multiple --topping can be passed|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

### Examples

Brew a double oat latte with two toppings:

```bash
clever coffee brew ethiopia -s 2 --milk oat --topping cinnamon --topping vanilla
```

Get the ID of the brewed coffee, to use it in a script:

```bash
clever coffee brew ethiopia -F json | jq -r '.id'
```
````

Content outside a custom `###` section (a paragraph right after the description or the tables) is dropped on the next run.

Custom sections are matched by the command path (the `since` badge can change). They are lost when a command is renamed or moved: move them by hand.

On a merge conflict in a `*.docs.md` file, resolve it keeping the custom sections of both sides, then run `npm run docs` to regenerate the rest.

## Release and `since`

A new command has `since: null` and its heading shows `<kbd>Unreleased</kbd>`. On the release PR, the `release-please.yml` workflow runs `scripts/resolve-since.js` to set the upcoming version, then `npm run docs`, and pushes the result as a ``docs(commands): resolve `since` to version <X.Y.Z>`` commit. It is expected, don't revert it (see [build-ci-and-release.md](build-ci-and-release.md)).
