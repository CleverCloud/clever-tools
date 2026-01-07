---
kind: '📌 Architecture Decision Records'
---
# ADR 0001: Rework file structure and documentation generation

🗓️ 2026-01-07 · ✍️ Hubert Sablonnière

This ADR explains the motivations and approach behind the file structure rework and the new documentation generation system.

## Context

The clever-tools project was initially created in December 2014.
Since then, it has evolved incrementally over the years without ever undergoing a complete rewrite or "big bang" refactoring effort.

### Original file organization

In the original architecture, the main entry point `bin/clever.js` was responsible for almost everything: all command-line options, arguments, the list of available commands with their documentation, and the routing logic that mapped subcommands to their parent commands.

On the implementation side, there was one file per main command (e.g., `addon.js`, `env.js`, `domain.js`).
Each of these files contained all the functions for the main command and its subcommands, along with any shared helper functions needed internally.

Here is an example of what the file structure looked like:

```
├── bin/
│   └── clever.js      # All definitions: options, args, commands, routing
└── src/
    └── commands/
        ├── addon.js   # All addon-related command implementations
        ├── env.js     # All env-related command implementations
        ├── domain.js  # All domain-related command implementations
        └── ...
```

### Command definition style

Commands, options, and arguments were defined using a specific pattern tied directly to the cliparse library API.

Here is an example of how an argument was defined:

```js
const args = {
  userId: cliparse.argument('user-id', {
    description: 'User ID',
    parser: (string) => string.match(userIdRegex)
      ? cliparse.parsers.success(string)
      : cliparse.parsers.error('Invalid user ID: ' + string),
  }),
};
```

Here is an example of how an option was defined:

```js
const opts = {
  format: cliparse.option('format', {
    description: 'Output format',
    aliases: ['F'],
    metavar: 'format',
    complete: () => cliparse.autocomplete.words(['human', 'json']),
    parser: (string) => ['human', 'json'].includes(string)
      ? cliparse.parsers.success(string)
      : cliparse.parsers.error('Invalid format: ' + string),
    default: 'human',
  }),
};
```

Here is an example of how a command was defined with both an option and an argument:

```js
const showUserCommand = cliparse.command('show', {
  description: 'Display user information',
  args: [args.userId],
  options: [opts.format],
  // subcommands would go here
  commands: [],
}, users.show);
```

## Problems

Over time, several issues emerged with the original architecture that made the codebase increasingly difficult to maintain and evolve.

### Lack of type safety

The original codebase had no typing whatsoever.
This meant that errors were only detected at runtime rather than at compile time.
Without type annotations, IDEs could not provide meaningful autocompletion or contextual help for developers working on the codebase.
This made development slower and more error-prone, especially for newcomers who had no way to discover the shape of objects or the expected types of function parameters.
Additionally, language models tend to perform better when working with typed code, as type annotations provide explicit context about data structures and expected values.

### Tight coupling with cliparse

As shown in the [command definition style](#command-definition-style) examples above, parsers needed to return `cliparse.parsers.success()` or `cliparse.parsers.error()`, and autocomplete functions needed to return `cliparse.autocomplete.words()`.
This created tight coupling between the application code and the underlying CLI parsing library.
As a result, evolving or replacing the library would require significant changes throughout the entire codebase.

### Difficult traceability of options and arguments

With all options and arguments defined in a single large `args` object and a single large `opts` object, then used across multiple commands, it was difficult to determine:

- Whether a declared option or argument was actually being used by any command
- Which commands were using which options and arguments
- Which options and arguments were meant to be global (shared across many commands) versus specific to a single command

This lack of traceability made it risky to remove or modify options and arguments, as the impact of such changes was not immediately visible.

### Poor discoverability for contributors

The monolithic structure made it challenging for new contributors to find where a specific command was implemented.
With all subcommand implementations grouped together in a single file per main command, developers had to navigate through large files to locate the relevant code.
To find which function corresponded to a given subcommand, one had to navigate through the large `bin/clever.js` file and trace the command routing manually.

### Monolithic file structure and git diff challenges

The central entry point file (`bin/clever.js`) had grown quite large, containing all command definitions, options, arguments, and routing logic.
Similarly, command implementation files like `addon.js` contained all related subcommands in a single file.

This structure created practical problems:

- **Git diffs became unwieldy**: any change to commands, options, or routing logic touched the same files, making code reviews more difficult and increasing the risk of merge conflicts
- **Not optimized for agent-assisted development**: in an era where developers increasingly work with AI agents, having smaller files that do one thing well makes it easier to provide focused context and get relevant assistance
  - Having smaller files that do one thing well is also a good for us humans ;-)

### Lack of flexibility for command reorganization

We anticipated the need to rework the overall command structure in the future.
For example, we might want to group about ten existing commands under a new `app` parent command, rename and reorganize other commands, or change option and argument names to improve the user experience.

With the monolithic structure, such changes would be risky and difficult to iterate on.
Any reorganization would require modifying the central routing file and potentially multiple command files simultaneously, making it hard to experiment with new structures without affecting the existing interface.

### Limited documentation generation capabilities

The command descriptions and argument objects were tightly bound to cliparse-specific structures.
This made any form of documentation generation awkward and fragile, as it required intimate knowledge of cliparse internals to extract the relevant information.

## Solutions

To address the problems described above, we implemented three complementary solutions: a new file structure, a type-safe definition system, and automatic documentation generation.

### File structure reorganization

Instead of having all command implementations grouped in a single file per main command (e.g., `addon.js`), we reorganized the codebase into a hierarchical structure where each command has its own file.

Here is an example of what the new file structure looks like:

```
├── bin/
│   └── clever.js                                # Entry point: converts definitions to cliparse
└── src/
    └── commands/
        ├── global.args.js                       # Shared argument definitions
        ├── global.options.js                    # Shared option definitions
        ├── global.commands.js                   # Command tree structure
        ├── addon/
        │   ├── addon.args.js                    # Addon-specific arguments
        │   ├── addon.command.js                 # Parent command definition
        │   ├── addon.create.command.js          # "addon create" subcommand
        │   ├── addon.delete.command.js          # "addon delete" subcommand
        │   ├── addon.list.command.js            # "addon list" subcommand
        │   ├── addon.providers.command.js       # "addon providers" subcommand
        │   └── addon.providers.show.command.js  # "addon providers show" subcommand
        ├── env/
        │   ├── env.command.js
        │   ├── env.get.command.js
        │   └── ...
        ├── domain/
        │   ├── domain.command.js
        │   ├── domain.add.command.js
        │   └── ...
        └── ...
```

This structure provides several benefits:

- **Improved discoverability**: developers can immediately locate the implementation of any command by following the naming convention `{category}/{category}.{action}.command.js`
- **Smaller git diffs**: changes to a single command only affect its dedicated file, reducing merge conflicts and making code reviews easier
- **Better suited for AI-assisted development**: smaller, focused files provide better context for AI agents
- **Unique and searchable file names**: the suffixes (`.command.js`, `.options.js`, `.args.js`, `.docs.md`) make it easy to find files in an IDE or for AI agents, and ensure that each file has a completely unique name across the project

### Type-safe definition system

#### Why not switch to another CLI framework?

We evaluated several existing CLI frameworks including [Stricli](https://github.com/bloomberg/stricli), [oclif](https://github.com/oclif/oclif), [gunshi](https://github.com/kazupon/gunshi), and others outside the Node.js ecosystem.
However, migrating the entire codebase to one of these frameworks would have been a significant undertaking with a high risk of breaking existing functionality.
Additionally, some of these frameworks include features we don't need, while lacking specific capabilities we require.

Instead, we chose to keep cliparse but isolate it to a single part of the codebase (the conversion layer in `bin/clever.js`).
This approach brings us closer to being able to remove cliparse entirely in the future, while minimizing disruption to the existing implementation.

#### The definition helpers

We introduced three helper functions (`defineArgument`, `defineOption`, `defineCommand`) that decouple the command definitions from the cliparse library while providing full type safety through Zod schemas.

We chose Zod because we appreciate the typing model used by frameworks like [Fastify](https://github.com/fastify/fastify), where handler types are inferred from a schema definition.
With Zod, the handler signature is automatically typed based on the schemas defined for options and arguments.

This approach gives us most of the benefits of type safety without requiring a full TypeScript migration.

Here is an example of how an argument is now defined:

```js
const userIdArg = defineArgument({
  schema: z.string().transform((string) => {
    if (!string.match(userIdRegex)) {
      throw new Error('Invalid user ID: ' + string);
    }
  }),
  description: 'User ID',
  placeholder: 'user-id',
});
```

Here is an example of how an option is now defined:

```js
const formatOption = defineOption({
  name: 'format',
  schema: z.enum(['human', 'json']).default('human'),
  description: 'Output format (human, json)',
  aliases: ['F'],
  placeholder: 'format',
  complete: () => ['human', 'json'],
});
```

Here is an example of how a command is now defined with both an option and an argument:

```js
export const showUserCommand = defineCommand({
  description: 'Display user information',
  since: '4.3.2',
  options: {
    format: formatOption,
  },
  args: [userIdArg],
  async handler(options, userId) {
    // options.format is typed as 'human' | 'json'
    // userId is typed as string
  },
});
```

The main entry point (`bin/clever.js`) is responsible for converting these definitions into cliparse-compatible objects at startup.
This conversion layer handles the translation between Zod schemas and cliparse parsers, deprecation warnings, and autocomplete functions.

This approach provides several benefits:

- **Decoupling from cliparse**: application code no longer needs to know about `cliparse.parsers.success()`, `cliparse.parsers.error()`, or `cliparse.autocomplete.words()`. Replacing or upgrading the CLI parsing library would only require changes to the conversion layer.
- **Type safety**: Zod schemas provide validation at parse time, and TypeScript infers the exact types for handler parameters based on the schema definitions.
- **Improved traceability**: each command explicitly declares its own options and arguments, making it easy to see which options are used where. Shared options (like `--format` or `--org`) are imported from `global.options.js`, making their global nature explicit.
- **Declarative deprecation**: options can include a `deprecated` field with a message explaining what to use instead. The conversion layer automatically displays a warning when a deprecated option is used.

### Automatic documentation generation

Thanks to the type-safe definition layer, we can now easily extract metadata from command definitions to generate documentation automatically.
We created a script that produces three types of documentation:

- `src/commands/README.md`: a comprehensive command reference listing all available commands with their options and arguments
- `src/commands/{category}/{category}.docs.md`: per-command documentation files
- `docs/llms-documentation.md`: documentation optimized for consumption by language models

Since the documentation is generated directly from the type-safe command definitions, it is always synchronized with the actual code.
Running `npm run docs` regenerates all documentation, and `npm run docs:check` verifies that documentation is up-to-date, which can be integrated into CI pipelines.

## Bonus

While working on the documentation generation, we realized that the same metadata extraction logic could be used to completely rework how cliparse displays `--help` output.
By patching cliparse's help generation, we were able to produce a more consistent and readable help format across all commands, inspired by the GitHub CLI (`gh`).

This refactoring effort was also a good opportunity to clean up the codebase:

- **Removed unused options and arguments**: with better traceability, it became easy to identify and remove options that were no longer used by any command.
- **Improved naming consistency**: we reviewed and standardized option names, argument placeholders, and descriptions across the entire CLI.

## Implementation approach

This large-scale refactoring was performed using automated scripts based on AST (Abstract Syntax Tree) transformations.
These scripts themselves were largely generated with the help of AI agents and LLMs.

For those curious about the process and the transformation scripts, the full implementation can be found in [PR #1001](https://github.com/CleverCloud/clever-tools/pull/1001).

## Future

This refactoring lays the groundwork for several future improvements.

We want to migrate the entire project to TypeScript with `.ts` files and no more `.js`.
This refactoring effort prepares us well for that transition.

We also know we want to remove cliparse from the codebase entirely.
However, we haven't decided yet whether we will migrate to one of the existing CLI frameworks we evaluated, or build a custom solution tailored to our specific needs.

### Command reorganization

We plan to rework the entire command structure: how commands and subcommands are organized, their naming, and potentially the naming of some options and arguments as well.

Thanks to the new file structure, we can now have both the current and the new command organization coexist in the codebase.
The idea is to introduce the new command structure behind a feature flag, while keeping the current organization as the default.
This allows us to ship both, reusing same implementation when possible without introducing breaking changes.

Once we are satisfied with the new command structure, we can make a breaking change release with the command structure and namings.
