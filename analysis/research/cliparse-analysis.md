# Cliparse CLI Framework Analysis

## Overview

Cliparse-node is a Node.js library for declarative command-line interface (CLI) parsing created by CleverCloud. It provides a flexible, declarative approach to building command-line applications with minimal boilerplate code.

## Core Features

- **Declarative CLI configuration**: Define CLI structure through configuration objects
- **Automatic help text generation**: Built-in help generation based on command/option definitions
- **Nested subcommands support**: Hierarchical command structures
- **Custom parsers**: Type-safe parsing with validation
- **Autocompletion**: Bash and ZSH shell completion support
- **Built-in type parsers**: Support for int, bool, string types

## 1. Command Description Structure

Commands in cliparse are defined using `cliparse.command()` with the following structure:

```javascript
const command = cliparse.command(
  "command-name",           // Command name
  {
    description: "...",     // Command description
    args: [...],            // Array of arguments
    options: [...],         // Array of options/flags
    commands: [...]         // Nested subcommands (optional)
  },
  handlerFunction          // Function to execute
);
```

### Example from cliparse repository:
```javascript
const echoCommand = cliparse.command(
  "echo",
  {
    description: "Display the given value",
    args: [cliparse.argument("value")],
    options: [cliparse.flag("reverse")]
  },
  echoModule
);
```

### Clever-tools pattern:
In the current clever-tools codebase, commands are defined as objects rather than using cliparse.command directly:

```javascript
export const createCommand = {
  name: 'create',
  description: 'Create an application',
  opts: { /* options object */ },
  args: [ /* arguments array */ ],
  execute: create  // handler function
};
```

## 2. Options and Flags Description

### Flag Definition
Flags are boolean options defined with `cliparse.flag()`:

```javascript
cliparse.flag("flag-name", {
  aliases: ["f"],           // Short aliases
  description: "...",       // Help text
  default: false           // Default value
})
```

### Option Definition
Options with values use `cliparse.option()`:

```javascript
cliparse.option("option-name", {
  aliases: ["o"],          // Short aliases  
  metavar: "VALUE",        // Placeholder in help
  description: "...",      // Help text
  default: null,           // Default value
  required: false,         // Whether required
  parser: customParser,    // Custom parser function
  complete: completeFunc   // Autocompletion function
})
```

### Naming Conventions
- **Kebab-case**: Options use kebab-case (e.g., `--update-notifier`)
- **Short aliases**: Single letter aliases (e.g., `-v` for `--verbose`)
- **Multiple aliases**: Options can have multiple aliases
- **Case sensitivity**: Options are case-sensitive
- **Length restrictions**: No apparent restrictions on option name length

## 3. Positional Arguments Description

Arguments are defined with `cliparse.argument()`:

```javascript
cliparse.argument("arg-name", {
  description: "...",       // Help text
  default: "defaultValue", // Default value
  parser: customParser,    // Parser for validation/transformation
  complete: completeFunc   // Autocompletion function
})
```

### Example:
```javascript
cliparse.argument("app-name", {
  description: "Application name (optional, current directory name is used if not specified)",
  default: "",
  parser: null,
  complete: null
})
```

### Argument Naming
- **Kebab-case**: Arguments use kebab-case naming
- **Descriptive names**: Clear, descriptive names preferred
- **Optional vs Required**: Determined by presence of default values

## 4. Required/Default Values Handling

### Required Options
Options are marked as required with the `required` property:

```javascript
cliparse.option("type", {
  required: true,
  metavar: "type",
  description: "Instance type"
})
```

### Default Values
Default values can be specified for both options and arguments:

```javascript
// Option with default
cliparse.option("region", {
  default: "par",
  description: "Region"
})

// Argument with default
cliparse.argument("app-name", {
  default: "",
  description: "Application name"
})
```

### Validation
- Required options must be provided or an error is thrown
- Default values override the required setting
- Custom parsers can implement additional validation

## 5. Aliases Handling

### Command Aliases
Commands can have aliases, though not prominently featured in the examples.

### Option Aliases
Options support multiple aliases:

```javascript
cliparse.option("org", {
  aliases: ["o", "owner"],  // Multiple aliases supported
  description: "Organisation to target"
})
```

### Alias Characteristics
- **Case sensitive**: Aliases are case-sensitive
- **Single character preferred**: Short aliases typically single letters
- **Multiple aliases**: Options can have multiple alternative names
- **No length restrictions**: No apparent restrictions on alias length

## 6. Formats/Parsers System

### Built-in Parsers
Cliparse provides built-in parsers for common types:
- `parsers.intParser` - Integer parsing
- `parsers.boolParser` - Boolean parsing  
- String parsing (default)

### Custom Parsers
Parsers are functions that return success/error objects:

```javascript
const colorParser = function(input) {
  const pattern = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
  const matches = input.match(pattern);
  
  if (matches !== null) {
    const components = matches.slice(1,4)
      .map(x => parseInt(x, 16));
    return parsers.success(components);
  } else {
    return parsers.error("invalid color code");
  }
}
```

### Parser Usage
```javascript
cliparse.argument("color", {
  parser: colorParser,
  description: "Color in hex format"
})
```

## 7. Benefits and Limitations

### Benefits
1. **Declarative approach**: Clean, readable command definitions
2. **Automatic help generation**: Consistent help text without manual work
3. **Type safety**: Built-in and custom parsers provide validation
4. **Nested commands**: Support for complex CLI hierarchies
5. **Autocompletion**: Built-in shell completion support
6. **Minimal boilerplate**: Less code needed vs manual argument parsing
7. **Consistent API**: Uniform way to define commands, options, and arguments

### Limitations
1. **Learning curve**: Requires understanding the cliparse paradigm
2. **Flexibility constraints**: Less flexible than manual argument parsing
3. **Dependency**: Adds external dependency to project
4. **Documentation**: Limited comprehensive documentation available
5. **Community**: Smaller ecosystem compared to alternatives like yargs or commander
6. **Error handling**: Parser error messages may need customization
7. **Complex validation**: Complex inter-option validation may be challenging

## 8. Clever-tools Create Command in Cliparse

Based on the current clever-tools create command structure, here's how it would look using pure cliparse:

```javascript
import cliparse from 'cliparse';

// Custom parsers (from clever-tools)
const nonEmptyStringParser = (input) => {
  if (!input || input.trim() === '') {
    return cliparse.parsers.error('Value cannot be empty');
  }
  return cliparse.parsers.success(input.trim());
};

// Completion functions
const completeTypes = () => {
  return cliparse.autocomplete.words(['docker', 'node', 'php', 'python', 'ruby', 'java', 'go', 'rust']);
};

const completeZones = () => {
  return cliparse.autocomplete.words(['par', 'rbx', 'sgp', 'mtl', 'syd', 'wsw']);
};

// Create command definition
const createCommand = cliparse.command(
  "create",
  {
    description: "Create an application",
    args: [
      cliparse.argument("app-name", {
        description: "Application name (optional, current directory name is used if not specified)",
        default: ""
      })
    ],
    options: [
      // Required type option
      cliparse.option("type", {
        aliases: ["t"],
        metavar: "type",
        description: "Instance type",
        required: true,
        complete: completeTypes
      }),
      
      // Region with default
      cliparse.option("region", {
        aliases: ["r"],
        metavar: "zone",
        description: "Region, can be 'par', 'rbx', 'sgp', 'mtl', 'syd', 'wsw'",
        default: "par",
        complete: completeZones
      }),
      
      // GitHub option
      cliparse.option("github", {
        metavar: "OWNER/REPO",
        description: "GitHub application to use for deployments"
      }),
      
      // Task command option
      cliparse.option("task", {
        aliases: ["T"],
        metavar: "command",
        description: "The application launch as a task executing the given command, then stopped",
        parser: nonEmptyStringParser
      }),
      
      // Global options
      cliparse.flag("color", {
        description: "Choose whether to print colors or not. You can also use --no-color",
        default: true
      }),
      
      cliparse.flag("update-notifier", {
        description: "Choose whether to use update notifier or not. You can also use --no-update-notifier",
        default: true
      }),
      
      cliparse.flag("verbose", {
        aliases: ["v"],
        description: "Verbose output"
      }),
      
      cliparse.option("org", {
        aliases: ["o", "owner"],
        metavar: "ID_OR_NAME", 
        description: "Organisation to target by its ID (or name, if unambiguous)"
      }),
      
      cliparse.option("alias", {
        aliases: ["a"],
        metavar: "alias",
        description: "Short name for the application"
      }),
      
      cliparse.option("format", {
        aliases: ["F"],
        metavar: "format",
        description: "Output format (human, json)",
        default: "human"
      })
    ]
  },
  createHandler
);

// Handler function
async function createHandler(params) {
  const { type: typeName } = params.options;
  const [rawName] = params.args;
  const { 
    org: orgaIdOrName, 
    alias, 
    region, 
    github: githubOwnerRepo, 
    format, 
    task: taskCommand 
  } = params.options;
  
  // Implementation would go here
  console.log('Creating application with:', {
    name: rawName || getCurrentDirectoryName(),
    type: typeName,
    region,
    org: orgaIdOrName,
    alias,
    github: githubOwnerRepo,
    task: taskCommand,
    format
  });
}

// CLI setup
const cli = cliparse.cli({
  name: "clever",
  description: "CLI tool to manage Clever Cloud's data and products",
  commands: [createCommand]
});

cliparse.parse(cli);
```

## Comparison with Current Clever-tools Structure

### Current Structure (Object-based):
```javascript
export const createCommand = {
  name: 'create',
  description: 'Create an application',
  opts: {
    type: { name: 'type', description: '...', type: 'option', ... },
    region: { name: 'region', description: '...', type: 'option', ... }
  },
  args: [{ name: 'app-name', description: '...' }],
  execute: create
};
```

### Pure Cliparse Structure (Function-based):
```javascript
const createCommand = cliparse.command("create", {
  description: "Create an application",
  options: [
    cliparse.option("type", { ... }),
    cliparse.option("region", { ... })
  ],
  args: [cliparse.argument("app-name", { ... })],
}, create);
```

### Key Differences:
1. **Declaration style**: Object vs function-based
2. **Option definition**: Separate option objects vs inline cliparse.option calls
3. **Type specification**: Explicit 'type' field vs implied by cliparse function
4. **Metadata handling**: More verbose in current structure
5. **Integration**: Current structure allows for additional metadata and processing layers

## Conclusion

Cliparse provides a solid foundation for CLI applications with its declarative approach and built-in features. For clever-tools, it offers good structure and consistency, though the current hybrid approach provides more flexibility for complex scenarios. The framework would work well for the create command, providing clean syntax and good autocompletion support, but may require additional abstraction layers for the full complexity of clever-tools' command system.

The main trade-offs involve simplicity vs flexibility - pure cliparse is cleaner but less customizable, while the current approach provides more control at the cost of additional complexity.