# Optique CLI Framework Analysis

## Overview

Optique is a type-safe CLI parser library for TypeScript that uses parser combinators, inspired by Haskell's `optparse-applicative` and Zod. Unlike traditional configuration-based CLI frameworks, Optique treats parsers as composable functions that can be assembled like "LEGO blocks" to create complex, type-safe command-line interfaces.

## Core Philosophy and Design

### Functional Composition Approach
- **Parser Combinators**: CLI parsers are built by composing small, reusable parser functions
- **Type-Driven Development**: Automatic TypeScript type inference eliminates manual type annotations
- **Constraint Expression**: Complex CLI constraints are expressed directly in parser structure, not validation logic
- **Composability**: Parser components can be shared across commands while preserving full type information

### Key Differentiators
1. **No Configuration Objects**: Unlike traditional CLI frameworks that use configuration objects, Optique uses functional composition
2. **Compile-Time Safety**: Full type checking and constraint validation at compile time
3. **Natural Composition**: Complex option relationships (mutually exclusive groups, shared option sets) are expressed naturally
4. **Functional Transformation**: Parsers can be transformed and combined using functional programming techniques

## API Analysis

### Core Parser Primitives

#### Options
```typescript
// Basic option with flag
const urlOption = option("-u", "--url", url());

// Optional option
const optionalUrl = optional(option("-u", "--url", url()));

// Multiple/repeated options
const multipleUrls = multiple(option("-a", "--allow", url()));

// Option with constraints
const portOption = option("-p", "--port", integer({ min: 1000, max: 65535 }));
```

#### Arguments
```typescript
// Positional argument
const fileArg = argument(file());

// Multiple positional arguments
const multipleFiles = multiple(argument(file()));
```

#### Commands/Subcommands
```typescript
const parser = or(
  command("download", object({
    targetDirectory: optional(option("-t", "--target", file())),
    urls: multiple(argument(url()))
  })),
  command("upload", object({
    action: constant("upload"),
    url: option("-d", "--dest", url()),
    files: multiple(argument(file()))
  }))
);
```

### Composition Operators

#### Core Combinators
- `optional()`: Makes any parser optional
- `multiple()`: Allows repeated parsing (for multiple values)
- `or()`: Creates mutually exclusive choices (discriminated unions)
- `object()`: Constructs structured parsers from multiple components
- `constant()`: Adds constant values (useful for discriminators)

#### Advanced Composition
```typescript
// Shared option groups
const commonOptions = object({
  verbose: optional(flag("-v", "--verbose")),
  config: optional(option("-c", "--config", file()))
});

// Mutually exclusive deployment options
const deployOptions = or(
  object({ 
    type: constant("local"),
    port: option("-p", "--port", integer()) 
  }),
  object({ 
    type: constant("cloud"),
    region: option("-r", "--region", string()) 
  })
);

// Final parser composition
const parser = merge(commonOptions, deployOptions);
```

### Type System Features

#### Automatic Type Inference
```typescript
// TypeScript automatically infers the result type
const parser = object({
  url: option("-u", "--url", url()),      // URL
  port: option("-p", "--port", integer()), // number
  files: multiple(argument(file()))       // File[]
});

// Result type is automatically:
// {
//   url: URL;
//   port: number;
//   files: File[];
// }
```

#### Discriminated Unions
```typescript
const commandParser = or(
  command("start", object({
    action: constant("start"),
    port: option("-p", "--port", integer())
  })),
  command("stop", object({
    action: constant("stop"),
    signal: optional(option("-s", "--signal", string()))
  }))
);

// Result type is automatically a discriminated union:
// | { action: "start"; port: number }
// | { action: "stop"; signal?: string }
```

## Naming Conventions and Standards

### Option Flags
- **Short flags**: Single dash with single character (e.g., `-v`, `-p`)
- **Long flags**: Double dash with descriptive name (e.g., `--verbose`, `--port`)
- **No explicit case restrictions**: Framework appears flexible on casing
- **Descriptive names**: Long flags should be self-documenting

### Aliases
- **Built into option definition**: Aliases are defined directly when creating options
- **No separate alias mechanism**: Short and long forms are specified together
- **No length restrictions observed**: Framework doesn't impose strict length limits
- **Case sensitivity**: Appears to be case-sensitive by default

### Argument Naming
- **Positional arguments**: No explicit naming in definition, names come from object structure
- **Semantic naming**: Use descriptive names that match the domain (e.g., `url`, `file`, `targetDirectory`)

## Default Values and Required Fields

### Default Handling
```typescript
// Optional with default through functional composition
const portWithDefault = optional(option("-p", "--port", integer())).default(3000);

// Optional without default (results in undefined)
const optionalConfig = optional(option("-c", "--config", file()));

// Required options (no optional wrapper)
const requiredUrl = option("-u", "--url", url());
```

### Required vs Optional Pattern
- **Required**: Define option directly without `optional()` wrapper
- **Optional**: Wrap with `optional()` function
- **Defaults**: Applied through functional composition or parser configuration

## Format Parsing and Validation

### Built-in Parsers
- `string()`: Basic string parsing
- `integer({ min?, max? })`: Integer with optional constraints
- `url()`: URL validation and parsing
- `file()`: File path validation
- `path()`: General path parsing

### Custom Parsers
```typescript
// Custom parser example (conceptual)
const emailParser = string().refine(value => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  "Invalid email format"
);
```

### Constraint System
- **Inline constraints**: Constraints are specified directly in parser definition
- **Compile-time validation**: Type system enforces constraints
- **Parse-time validation**: Runtime validation with helpful error messages

## Benefits

### 1. **Type Safety**
- Automatic type inference eliminates manual type annotations
- Compile-time catching of CLI definition errors
- Full IntelliSense support for parsed results

### 2. **Composability**
- Reusable parser components across multiple commands
- Natural composition of complex option relationships
- Easy sharing of common option groups

### 3. **Expressiveness**
- Complex constraints expressed directly in parser structure
- Mutually exclusive options handled naturally through `or()` combinator
- Discriminated unions for subcommands with full type safety

### 4. **Maintainability**
- Functional approach makes CLI definitions more declarative
- Easy to refactor and extend existing parsers
- Clear separation of parsing logic from business logic

### 5. **Developer Experience**
- Strong TypeScript integration
- Helpful error messages at parse time
- Functional programming patterns familiar to modern developers

## Limitations

### 1. **Learning Curve**
- Requires understanding of parser combinators and functional programming concepts
- More complex than traditional configuration-based approaches
- May be overkill for simple CLI applications

### 2. **Limited Ecosystem**
- Newer framework with smaller community
- Fewer examples and documentation compared to established frameworks
- Limited third-party extensions

### 3. **Parsing Focus Only**
- Only handles argument parsing, not command execution or application structure
- Requires additional tooling for complete CLI application development
- No built-in help generation or command routing

### 4. **Initial Setup Complexity**
- More verbose for simple CLI applications
- Requires more upfront design thinking
- Best suited for complex CLIs that will evolve over time

### 5. **Runtime Dependencies**
- Adds TypeScript/parser combinator dependencies
- May have larger bundle size compared to simpler solutions

## Use Case Analysis

### Ideal For:
- **Complex CLI applications** with many interconnected options
- **Multi-command tools** with shared option groups
- **Type-safe environments** where compile-time guarantees are valued
- **Evolving CLIs** that will grow in complexity over time
- **Teams** that prioritize consistent CLI patterns

### Not Ideal For:
- **Simple scripts** with basic argument parsing needs
- **Rapid prototyping** where quick setup is prioritized
- **Non-TypeScript projects** (though could work with type definitions)
- **Developers unfamiliar** with functional programming concepts

## Clever-Tools Create Command Example

Here's how the current `clever-tools create` command would be structured using Optique:

### Current Command Structure
```javascript
// Current clever-tools create command
{
  name: 'create',
  description: 'Create an application',
  opts: {
    type: { required: true, aliases: ['t'] },
    region: { default: 'par', aliases: ['r'] },
    github: { optional: true },
    task: { aliases: ['T'] },
    // ... global options
  },
  args: [
    { name: 'app-name', optional: true }
  ]
}
```

### Optique Implementation

```typescript
import { 
  option, 
  optional, 
  argument, 
  object, 
  string, 
  constant,
  merge,
  flag,
  command,
  run
} from '@optique/core';

// Reusable global options that can be shared across commands
const globalOptions = object({
  color: optional(flag('--color')),
  verbose: optional(flag('-v', '--verbose')),
  org: optional(option('-o', '--org', string())),
  alias: optional(option('-a', '--alias', string())),
  format: optional(option('-f', '--format', string().refine(
    v => ['human', 'json'].includes(v),
    'Format must be human or json'
  )))
});

// Custom parsers for clever-cloud specific types
const instanceType = string().refine(
  async (value) => {
    const availableTypes = await listAvailableTypes();
    return availableTypes.includes(value);
  },
  'Invalid instance type'
);

const region = string().refine(
  async (value) => {
    const availableZones = await listAvailableZones();
    return availableZones.includes(value);
  },
  'Invalid region'
).default('par');

const githubRepo = string().refine(
  value => /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(value),
  'GitHub repository must be in OWNER/REPO format'
);

// Create command specific options
const createOptions = object({
  type: option('-t', '--type', instanceType),
  region: optional(option('-r', '--region', region)),
  github: optional(option('--github', githubRepo)),
  task: optional(option('-T', '--task', string()))
});

// Application name as optional positional argument
const createArgs = object({
  appName: optional(argument(string()))
});

// Complete create command parser
const createCommand = command('create', object({
  description: constant('Create an application'),
  options: merge(createOptions, globalOptions),
  args: createArgs
}));

// Usage example
async function main() {
  try {
    const result = await run(createCommand, process.argv.slice(2));
    
    // TypeScript knows the exact shape of result:
    // {
    //   description: 'Create an application';
    //   options: {
    //     type: string;
    //     region?: string;
    //     github?: string;
    //     task?: string;
    //     color?: boolean;
    //     verbose?: boolean;
    //     org?: string;
    //     alias?: string;
    //     format?: string;
    //   };
    //   args: {
    //     appName?: string;
    //   };
    // }
    
    await executeCreate(result);
  } catch (error) {
    console.error('Parse error:', error.message);
    process.exit(1);
  }
}

async function executeCreate(params) {
  const { options, args } = params;
  const { type, region = 'par', github, task } = options;
  const { appName } = args;
  
  // Implementation logic here...
  // All types are properly inferred and type-safe
}
```

### Alternative: Multi-Command Structure

For a complete CLI tool with multiple commands:

```typescript
// Define shared option groups
const globalOpts = object({
  verbose: optional(flag('-v', '--verbose')),
  org: optional(option('-o', '--org', string())),
  format: optional(option('-f', '--format', string()))
});

// Individual command parsers
const createCmd = command('create', object({
  action: constant('create'),
  type: option('-t', '--type', instanceType),
  region: optional(option('-r', '--region', region)),
  github: optional(option('--github', githubRepo)),
  task: optional(option('-T', '--task', string())),
  appName: optional(argument(string()))
}));

const deployCmd = command('deploy', object({
  action: constant('deploy'),
  force: optional(flag('--force')),
  branch: optional(option('-b', '--branch', string()))
}));

const deleteCmd = command('delete', object({
  action: constant('delete'),
  app: argument(string()),
  skipConfirmation: optional(flag('--yes'))
}));

// Main CLI parser with discriminated union of commands
const cleverToolsParser = object({
  global: globalOpts,
  command: or(createCmd, deployCmd, deleteCmd)
});

// TypeScript automatically infers:
// {
//   global: { verbose?: boolean; org?: string; format?: string };
//   command: 
//     | { action: 'create'; type: string; region?: string; /* ... */ }
//     | { action: 'deploy'; force?: boolean; branch?: string }
//     | { action: 'delete'; app: string; skipConfirmation?: boolean };
// }
```

## Benefits for Clever-Tools

### 1. **Type Safety Improvements**
- Compile-time validation of CLI definitions
- Automatic type inference eliminates manual type annotations
- IntelliSense support for all parsed options and arguments

### 2. **Better Composition**
- Reusable option groups across commands (global options, deployment options, etc.)
- Natural expression of mutually exclusive options
- Easy sharing of common patterns

### 3. **Enhanced Validation**
- Built-in constraint checking with helpful error messages
- Custom parsers for Clever Cloud specific types (instance types, regions)
- Parse-time validation instead of runtime checking

### 4. **Improved Maintainability**
- Declarative CLI definitions that are easier to understand
- Functional composition makes extending commands straightforward
- Clear separation between parsing and execution logic

## Recommendation

Optique would be **beneficial for clever-tools** because:

1. **Complex CLI Structure**: Clever-tools has many commands with shared global options and complex option relationships
2. **Type Safety**: The TypeScript codebase would benefit from compile-time CLI validation
3. **Maintainability**: The functional approach would make the CLI definitions more maintainable as the tool grows
4. **Developer Experience**: Better IntelliSense and type checking would improve development productivity

However, consider the **migration effort**:
- Requires rewriting existing CLI definitions
- Team needs to learn parser combinator concepts
- May need custom parsers for Clever Cloud specific validation

The investment would be worthwhile for a complex, evolving CLI tool like clever-tools, especially given the TypeScript codebase and the need for robust type safety.