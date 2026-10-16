# Creating a command

Commands are declared with `defineCommand`, `defineOption` and `defineArgument`, on top of `cliparse`. Options and arguments are validated and parsed by [Zod](https://zod.dev) schemas, and their types flow into the handler. The reasons behind this design are explained in [ADR 0001](../adr/adr-0001-rework-file-structure.md).

Before writing a command, look at a similar one and copy its naming, file layout, output format and error messages. `src/commands/drain/` is a good example of a command group with shared arguments and options.

## Example

A fictional `clever coffee brew <blend>` subcommand, part of a `coffee` group (neither exists in the CLI). The `<blend>` argument is shared by several `coffee` subcommands, so it lives in `coffee.args.js`:

```js
// src/commands/coffee/coffee.args.js
import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';

export const blendArg = defineArgument({
  schema: z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and dashes'),
  description: 'Blend of coffee',
  placeholder: 'blend',
});
```

`--shots`, `--milk` and `--topping` are only used by this subcommand, so they are defined inline. `--format` comes from `global.options.js`:

```js
// src/commands/coffee/coffee.brew.command.js
import { z } from 'zod';
import { brewCoffee } from '../../clever-client/coffee.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { blendArg } from './coffee.args.js';

export const coffeeBrewCommand = defineCommand({
  description: 'Brew a coffee',
  since: null,
  options: {
    shots: defineOption({
      name: 'shots',
      schema: z.coerce.number().int().min(1).max(4).default(1),
      description: 'Number of espresso shots',
      aliases: ['s'],
      placeholder: 'shots',
    }),
    milk: defineOption({
      name: 'milk',
      schema: z.enum(['none', 'whole', 'oat']).default('none'),
      description: 'Kind of milk',
      placeholder: 'milk',
    }),
    toppings: defineOption({
      name: 'topping',
      schema: z
        .union([z.string(), z.array(z.string())])
        .transform((value) => (typeof value === 'string' ? [value] : value))
        .optional(),
      description: 'Topping to add. Multiple --topping can be passed',
      placeholder: 'topping',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [blendArg],
  async handler(options, blend) {
    const { shots, milk, toppings, format } = options;

    const coffee = await brewCoffee({ blend, shots, milk, toppings: toppings ?? [] }).then(sendToApi);

    if (format === 'json') {
      Logger.printJson(coffee);
    } else {
      Logger.printSuccess(`Coffee ${blend} brewed with ${shots} shot(s)`);
    }
  },
});
```

```bash
clever coffee brew ethiopia -s 2 --milk oat --topping cinnamon --topping vanilla
```

When the handler runs, `blend` matches the regex, `shots` is an integer between 1 and 4 (`1` when omitted), `milk` is one of the three values and `toppings` is an array of strings, or `null` when no `--topping` is passed (hence the `?? []`: a `.default([])` would print an empty `(default: )` in the help). Invalid input is rejected with the Zod message before the handler is called.

## Files

- One directory per root command: `src/commands/<command>/`.
- One file per command or subcommand: `<command>.command.js`, `<command>.<sub>.command.js`. Deeper levels chain the names: `k8s.nodegroups.create.command.js`.
- Arguments and options shared by several subcommands go in `<command>.args.js` and `<command>.options.js`. One used by a single command stays in its `.command.js` file.
- Options and arguments shared across commands live in `src/commands/global.options.js` and `global.args.js` (`--app`, `--alias`, `--org`, `--format`, `--yes`…). Reuse them before defining a new one.

## `defineCommand`

| Property | |
|---|---|
| `description` | Shown in `--help` and in the generated docs. |
| `since` | Version that introduced the command, shown as a badge in the generated docs. Always `null` for a new command: the release workflow replaces it with the upcoming version (`scripts/resolve-since.js`) when the PR is released. Never change it on a released command. |
| `options` | Object of options. The key is the property name in the handler's `options`, the CLI name comes from the option's `name` (see [below](#key-and-flag-names-are-independent)). |
| `args` | Array of positional arguments, passed to the handler after `options`. |
| `handler` | `async (options, ...args) => {}`, or `null` for a command group. |
| `examples` | Optional usage examples shown in `--help` (see `kv.command.js`). |
| `featureFlag`, `isExperimental` | Hide the command until `clever features enable <flag>`, and mark it as experimental in the docs. |

## `defineOption`

| Property | |
|---|---|
| `name` | CLI name: `'size'` for `--size`. |
| `schema` | Zod schema: type, default value, validation, parsing. |
| `description` | Shown in `--help` and in the generated docs. |
| `aliases` | Other names. A single letter becomes a short flag, a longer one a long flag. Don't reuse a global one (`-v`, `--color`). |
| `placeholder` | Shown after the name in the help: `--size <size>`. |
| `complete` | Optional shell completion function, sync or async. |
| `deprecated` | `true`, or a string with migration instructions. |

A boolean option is a flag: `schema: z.boolean().default(false)`.

```js
// src/commands/global.options.js: `-F, --format <format>`
defineOption({ name: 'format', aliases: ['F'], /* ... */ });

// src/commands/global.options.js: `--before <before>, --until <before>`
defineOption({ name: 'before', aliases: ['until'], /* ... */ });

// src/commands/global.options.js: `--after <after>, --since <after>`
defineOption({ name: 'after', aliases: ['since'], /* ... */ });

// src/commands/global.options.js: `-o, --org, --owner <org-id|org-name>`
defineOption({ name: 'org', aliases: ['o', 'owner'], /* ... */ });
```

An option that can be repeated (`--option a=1 --option b=2`) is received as a string when passed once and as an array when passed several times. Accept both and normalize in the schema, as `--option` of `clever addon create` does (`addonOptions` in `src/parsers.js`):

```bash
clever addon create <provider> <name> --option <option1>=true --option <option2>=disabled
```

```js
// src/commands/addon/addon.create.command.js
option: defineOption({
  name: 'option',
  schema: z.union([z.string(), z.array(z.string())]).transform(addonOptions).optional(),
  // ...
}),
```

For a list in a single value (`--rights a,b`), parse it instead: `z.string().transform(commaSeparated)`.

### Key and flag names are independent

The key of an option in `options` is the name the handler receives, and it does not have to match the flag. Pick the key that reads best in the handler, so you don't need to rename it with a destructuring.

In the example above, the flag is `--topping` (singular, as typed once) and the key is `toppings`, since the handler gets an array:

```js
options: {
  toppings: defineOption({ name: 'topping', /* ... */ }),
},
async handler(options) {
  const { toppings } = options;
  // ...
},
```

Real commands do the same: `clever drain check` exposes `--app` and reads `appIdOrName`, which tells that the value is not resolved yet (`src/commands/drain/drain.check.command.js`). Only `name` is shown to the user, in `--help` and in the generated docs.

## `defineArgument`

| Property | |
|---|---|
| `schema` | Zod schema: type, validation, parsing. The argument is required unless the schema is `.optional()`. |
| `description` | Shown in `--help` and in the generated docs. |
| `placeholder` | Name shown in the usage: `<blend>`. |
| `complete` | Optional shell completion function, sync or async. |
| `deprecated` | `true`, or a string with migration instructions. |

No `name`: an argument is positional, so the handler receives it by position, after `options`.

## Zod schemas

Validation and parsing live in the schema, not in the handler. CLI values arrive as strings:

```js
z.string().min(3).max(50)                     // validation
z.enum(['human', 'json']).default('human')    // closed set of values, listed in the docs
z.coerce.number().int().min(0)                // numbers
z.string().transform(commaSeparated)          // parsing, with a helper from src/parsers.js
z.string().transform(appIdOrName).optional()  // name or ID, resolved later in the handler
```

Reusable transformers (`appIdOrName`, `addonIdOrName`, `date`, `durationInSeconds`, `tags`…) live in `src/parsers.js`. A transformer throws an `Error` to reject a value.

## Handler conventions

- Start by destructuring `options` (and name the positional arguments in the signature), then work with plain variables: `const { shots, milk, format } = options;`.
- Resolve names and IDs with `Application.resolveId()` and `src/models/ids-resolver.js`, never by hand (see [api-client.md](api-client.md)).
- Print through `Logger` (`src/logger.js`), never `console.log`. Offer `--format json` (`humanJsonOutputFormatOption`) with `Logger.printJson()` when the output is useful to scripts.
- Fail by throwing an `Error` with a message the user can act on. `src/lib/cliparse-patched.js` prints it and the process exits with code 1. To forward another exit code, set `process.exitCode` (see `ssh.command.js`) rather than calling `process.exit()`.
- Destructive commands ask for confirmation with `src/lib/prompts.js` and accept `--yes` (`skipConfirmationOption`).

## Registering the command

Add it to the `globalCommands` tree of `src/commands/global.commands.js`. The order of the entries is the order of `clever help`.

A command without subcommands is a plain entry, a group is a `[command, { subcommands }]` pair, and groups nest (`drain create` is a group inside `drain`):

```js
export const globalCommands = {
  // ...
  coffee: [
    coffeeCommand, // group: no handler
    {
      brew: coffeeBrewCommand,
      grind: coffeeGrindCommand,
    },
  ],
};
```

Then run `npm run docs` to generate `src/commands/coffee/coffee.docs.md` and update `src/commands/README.md` (see [docs-generation.md](docs-generation.md)), and try the command from source (see [testing.md](testing.md)).
