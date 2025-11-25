# Node.js util.parseArgs Analysis

## Overview

Node.js `util.parseArgs()` is a built-in command-line argument parsing utility introduced in Node.js 18.3.0 and 16.17.0, becoming stable in v20.0.0. It provides a higher-level API than directly interacting with `process.argv`, offering structured parsing with configuration options.

## 1. Official Documentation Research

### Core API

```javascript
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  args: string[],        // Arguments to parse (defaults to process.argv slice)
  options: {             // Option definitions
    optionName: {
      type: 'boolean' | 'string',  // Required: argument type
      multiple: boolean,           // Optional: allow multiple values
      short: string,              // Optional: single character alias
      default: any                // Optional: default value (Node.js 18.11.0+)
    }
  },
  strict: boolean,              // Optional: throw on unknown args (default: true)
  allowPositionals: boolean,    // Optional: accept positional args
  allowNegative: boolean,       // Optional: allow --no-option negation
  tokens: boolean              // Optional: return detailed parse info
});
```

### Return Value Structure

```javascript
{
  values: Object,       // Parsed option values (prototype-null object)
  positionals: string[], // Positional arguments array
  tokens?: Token[]      // Detailed parsing info (if tokens: true)
}
```

## 2. Commands/Subcommands Support

**Key Finding**: `util.parseArgs()` does **NOT** natively support commands or subcommands like `git clone` or `npm install`.

### Workaround Implementation

Commands can be implemented using positional arguments and the `tokens` API:

```javascript
function parseSubcommand(config) {
  const { tokens } = parseArgs({
    ...config,
    tokens: true,
    allowPositionals: true
  });
  
  let firstPosToken = tokens.find(({ kind }) => kind === 'positional');
  if (!firstPosToken) {
    throw new Error('Command name is missing');
  }
  
  // Parse command-level options (before subcommand)
  const cmdArgs = config.args.slice(0, firstPosToken.index);
  const commandResult = parseArgs({
    ...config,
    args: cmdArgs,
    tokens: false,
    allowPositionals: false
  });
  
  // Parse subcommand and its options
  const subcommandName = firstPosToken.value;
  const subcmdArgs = config.args.slice(firstPosToken.index + 1);
  const subcommandResult = parseArgs({
    ...config,
    args: subcmdArgs,
    tokens: false
  });
  
  return { commandResult, subcommandName, subcommandResult };
}
```

## 3. Options/Flags Analysis

### Supported Option Types
- **Boolean flags**: `--verbose`, `--no-color`
- **String options**: `--name value`, `--name=value`

### Naming Conventions
- **Long names**: Kebab-case recommended (`--output-format`)
- **Short aliases**: Single character (`-v`, `-o`)
- **Negation**: Automatic with `allowNegative: true` (`--no-verbose`)

### Configuration Structure
```javascript
options: {
  'output-format': {
    type: 'string',
    short: 'o',
    default: 'human',
    multiple: false
  },
  verbose: {
    type: 'boolean',
    short: 'v'
  }
}
```

## 4. Positional Arguments

### Characteristics
- **Simple array**: All positionals returned as `string[]`
- **No descriptions**: No built-in way to describe positional arguments
- **No validation**: No built-in validation or parsing
- **Order-dependent**: Parsed in the order they appear

### Access Pattern
```javascript
const { positionals } = parseArgs({
  allowPositionals: true,
  // ... other config
});

const [firstArg, secondArg] = positionals;
```

## 5. Required/Default Values

### Default Values (Node.js 18.11.0+)
```javascript
options: {
  region: {
    type: 'string',
    default: 'par'  // Built-in default support
  }
}
```

### Required Options
**Limitation**: No built-in `required` field. Must be implemented manually:

```javascript
const { values } = parseArgs({ options, args });

// Manual validation required
if (!values.type) {
  throw new Error('--type is required');
}
```

## 6. Aliases Support

### Option Aliases
- **Short aliases**: Single character only (`short: 'r'`)
- **Multiple aliases**: Not supported natively
- **Case sensitivity**: Case-sensitive
- **Length restrictions**: Short aliases must be exactly one character

### Alias Limitations
```javascript
// ✅ Supported
options: {
  region: { type: 'string', short: 'r' }
}

// ❌ Not supported natively
options: {
  region: { 
    type: 'string', 
    aliases: ['r', 'reg', 'zone']  // Multiple aliases not supported
  }
}
```

## 7. Formats/Parsers

### Parser Support
**Major Limitation**: No built-in parsing or validation beyond basic type coercion.

```javascript
// ✅ Basic type validation
options: {
  port: { type: 'string' }  // Always returns string, no number parsing
}

// ❌ Advanced parsing not supported
options: {
  port: { 
    type: 'number',           // Not supported
    parser: parseInt,         // Not supported
    validate: (val) => val > 0 // Not supported
  }
}
```

### Manual Parsing Required
```javascript
const { values } = parseArgs({ options, args });

// Manual parsing and validation
const port = parseInt(values.port);
if (isNaN(port) || port <= 0) {
  throw new Error('Port must be a positive number');
}
```

## 8. Benefits and Limitations

### Benefits ✅
1. **Built-in**: No external dependencies required
2. **Lightweight**: Minimal API surface
3. **Stable**: Part of Node.js core since v20.0.0
4. **Token API**: Advanced parsing capabilities for custom implementations
5. **Automatic help**: Basic option parsing with consistent behavior
6. **Negation support**: Built-in `--no-option` handling

### Limitations ❌
1. **No subcommands**: Must implement manually using tokens API
2. **No required options**: Manual validation required
3. **Limited aliases**: Only single-character short aliases
4. **No parsing/validation**: Only basic string/boolean types
5. **No help generation**: No automatic `--help` text
6. **No argument descriptions**: Positional args lack metadata
7. **No completion**: No built-in shell completion support
8. **No numeric types**: All non-boolean values are strings

## 9. Clever-Tools Create Command Implementation

### Current Command Structure
```javascript
// Current clever-tools structure
{
  name: 'create',
  description: 'Create an application',
  opts: {
    type: { required: true, aliases: ['t'] },
    region: { default: 'par', aliases: ['r'] },
    github: { type: 'option' },
    task: { aliases: ['T'] },
    // Global options
    color: { type: 'flag', default: true },
    verbose: { type: 'flag', aliases: ['v'] },
    org: { aliases: ['o', 'owner'] },
    alias: { aliases: ['a'] },
    format: { aliases: ['F'], default: 'human' }
  },
  args: [
    { name: 'app-name', description: 'Application name (optional)' }
  ]
}
```

### Node.js parseArgs Implementation

```javascript
import { parseArgs } from 'node:util';

// Option definitions for parseArgs
const options = {
  // Command-specific options
  type: {
    type: 'string',
    short: 't'
    // Note: No built-in required field
  },
  region: {
    type: 'string',
    short: 'r',
    default: 'par'
  },
  github: {
    type: 'string'
    // Note: No aliases support beyond single character
  },
  task: {
    type: 'string',
    short: 'T'  // Capital T as alias
  },
  
  // Global options
  color: {
    type: 'boolean',
    default: true
  },
  verbose: {
    type: 'boolean',
    short: 'v'
  },
  org: {
    type: 'string',
    short: 'o'
    // Note: Cannot have multiple aliases like ['o', 'owner']
  },
  alias: {
    type: 'string',
    short: 'a'
  },
  format: {
    type: 'string',
    short: 'F',
    default: 'human'
  }
};

// Parse function
function parseCreateCommand(args = process.argv.slice(2)) {
  try {
    const { values, positionals } = parseArgs({
      args,
      options,
      allowPositionals: true,
      allowNegative: true,  // Allows --no-color
      strict: true
    });

    // Manual validation for required options
    if (!values.type) {
      throw new Error('--type is required');
    }

    // Extract positional arguments
    const [appName] = positionals;

    return {
      options: values,
      args: {
        'app-name': appName || ''  // Optional app name
      }
    };
  } catch (error) {
    console.error('Error parsing arguments:', error.message);
    process.exit(1);
  }
}

// Usage examples
const result1 = parseCreateCommand([
  '--type', 'node',
  '--region', 'par', 
  '--verbose',
  'my-app'
]);
// Result: { 
//   options: { type: 'node', region: 'par', verbose: true, ... },
//   args: { 'app-name': 'my-app' }
// }

const result2 = parseCreateCommand([
  '-t', 'node',
  '-r', 'rbx',
  '--no-color',
  '--github', 'user/repo'
]);
// Result: { 
//   options: { type: 'node', region: 'rbx', color: false, github: 'user/repo', ... },
//   args: { 'app-name': '' }
// }
```

### Required Adaptations for Clever-Tools

1. **Manual validation layer**:
```javascript
function validateCreateOptions(values) {
  const errors = [];
  
  if (!values.type) {
    errors.push('--type is required');
  }
  
  if (values.github && !values.github.includes('/')) {
    errors.push('--github must be in OWNER/REPO format');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
```

2. **Help text generation**:
```javascript
function generateHelp() {
  return `
Usage: clever create [OPTIONS] [APP-NAME]

Create an application

Options:
  -t, --type TYPE        Instance type (required)
  -r, --region REGION    Region (default: par)
      --github REPO      GitHub repository (OWNER/REPO format)
  -T, --task COMMAND     Run as task with command
  -v, --verbose          Verbose output
  -o, --org ORG          Organisation ID or name
  -a, --alias ALIAS      Application alias
  -F, --format FORMAT    Output format (default: human)
      --color            Use colors (default: true)
      --no-color         Disable colors

Arguments:
  APP-NAME               Application name (optional, uses current directory)
`;
}
```

3. **Workaround for multiple aliases**:
```javascript
// Since parseArgs doesn't support multiple aliases, we'd need preprocessing
function preprocessArgs(args) {
  return args.map(arg => {
    // Convert --owner to --org
    if (arg === '--owner') return '--org';
    return arg;
  });
}
```

## Conclusion

Node.js `util.parseArgs()` provides a solid foundation for basic argument parsing but requires significant additional work for complex CLI applications like clever-tools. While it handles the core parsing logic well, the lack of built-in support for subcommands, required options, advanced validation, and multiple aliases means substantial boilerplate code is needed.

For clever-tools, `util.parseArgs()` could work but would require:
- Manual validation layer for required options
- Custom help text generation
- Workarounds for multiple aliases
- Additional parsing for complex option types
- Manual subcommand handling if needed

The current cliparse-based solution provides more features out of the box, making it more suitable for a complex CLI tool like clever-tools.