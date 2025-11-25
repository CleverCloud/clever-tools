# Stricli CLI Framework Analysis

## Overview

Stricli is a zero-dependency TypeScript CLI framework developed by Bloomberg designed to build complex command-line interfaces with type safety. Unlike many other CLI frameworks, Stricli was purpose-built to address real-world limitations found in existing JavaScript/TypeScript CLI tools.

## Key Features

- **Zero Dependencies**: Self-contained command line parser with no runtime dependencies
- **Type Safety**: Full TypeScript support with types flowing through the entire application
- **Lazy Loading**: Supports asynchronous module loading via ECMAScript import() syntax
- **Code Splitting**: Command implementations are separated from parameters, allowing code splitting
- **Shell Autocomplete**: First-class tab completion support (currently bash)
- **Flexibility**: Commands are just objects that can be structured in any way

## Architecture and Design Philosophy

Stricli follows three core principles:

1. **"Commands Are Just Functions"**: Commands are implemented as regular functions
2. **"When Parsing, Form Follows Function"**: The framework parses inputs to match function signatures
3. **"No 'Magic' Features or Patterns"**: Avoids hidden or implicit behaviors

### Command Structure

Commands in Stricli are objects that can be organized using route maps:

```typescript
// Basic command structure
const command = {
  // Command definition and metadata
  // Implementation function
};

// Route maps organize multiple commands
buildRouteMap({
  routes: {
    create: createCommand,
    deploy: deployCommand,
    delete: deleteCommand
  },
  docs: {
    brief: "Application management commands"
  }
});
```

## Command Definition Analysis

### 1. Command Description
- Commands have metadata including name, description, and documentation
- Route maps require a `brief` description for help text
- Optional `fullDescription` can provide detailed multi-line explanations
- Commands can be marked as experimental or hidden

### 2. Options/Flags Handling

Based on the documentation and patterns observed:

#### Naming Conventions:
- Flags use kebab-case naming (e.g., `--update-notifier`)
- Options can have single-character aliases
- Case sensitivity appears to follow standard CLI conventions

#### Flag Definition:
- Flags are type-safe and defined with TypeScript types
- Support for various built-in types
- Flags are the first parameter in command implementation functions
- Named flags can be parsed with custom parsers

#### Structure:
```typescript
// Inferred structure based on documentation
{
  flagName: {
    description: string,
    type: 'boolean' | 'string' | 'number' | etc,
    aliases?: string[],
    default?: any,
    required?: boolean,
    parser?: Function
  }
}
```

### 3. Positional Arguments

#### Characteristics:
- Parsed in order from non-flag arguments
- Must use explicit string parsers
- Two supported patterns:
  - Explicit: `(flags, a, b, c) => {}`
  - Rest array: `(flags, ...args: T[]) => {}`

#### Features:
- Optional arguments require `optional: true`
- Default values specified as strings
- Placeholders for semantic help text
- Support for min/max bounds on arrays

#### Limitations:
- No complex tuple types as rest parameters
- All positional args must have same type in rest arrays

### 4. Required/Default Values

- **Required flags**: Specified in flag definition
- **Default values**: Can be set for both flags and positional arguments
- **Optional arguments**: Must be explicitly marked as optional
- **Type safety**: Default values flow through TypeScript type system

### 5. Aliases

#### Support:
- Single-character aliases for flags (e.g., `-t` for `--type`)
- Multiple aliases appear to be supported based on patterns
- Route-level aliases via route maps

#### Conventions:
- Short aliases typically single characters
- No apparent length restrictions mentioned
- Case sensitivity follows CLI standards

### 6. Formats/Parsers

#### Parsing System:
- **Flags**: Support built-in types or custom parsers
- **Positional Args**: Require explicit string parsers
- **Type Safety**: Parsers ensure type consistency
- **Custom Parsers**: Can implement custom parsing logic

#### Built-in Support:
- Standard types (string, number, boolean)
- Custom validation and transformation
- Error handling for invalid inputs

## Benefits

### Strengths:
1. **True Type Safety**: End-to-end TypeScript support with no type erasure
2. **Performance**: Lazy loading prevents loading unused command code
3. **Zero Dependencies**: No external runtime dependencies
4. **Modularity**: Clean separation between command definition and implementation
5. **Developer Experience**: Excellent IntelliSense and compile-time validation
6. **Shell Integration**: Native autocomplete support
7. **Flexible Architecture**: Commands as objects allow any organizational structure

### Innovative Features:
- Code splitting with help generation without importing runtime code
- Dynamic autocomplete based on actual application logic
- Type-safe command routing with nested subcommands

## Limitations

### Identified Constraints:
1. **Learning Curve**: Requires understanding of TypeScript and the framework's patterns
2. **Documentation**: Limited practical examples in current documentation
3. **Ecosystem**: Newer framework with smaller community
4. **Complexity**: May be overkill for simple CLI applications
5. **Shell Support**: Currently only bash autocomplete (though more planned)

### Technical Limitations:
- Complex tuple types not supported for positional arguments
- Requires TypeScript for full benefits
- Limited to specific argument patterns

## Comparison with Current Clever-Tools Architecture

### Current Structure:
The clever-tools `create` command uses a simple object-based structure:

```javascript
export const createCommand = {
  name: 'create',
  description: 'Create an application',
  opts: {
    type: { /* config */ },
    region: { /* config */ },
    // ...
  },
  args: [{ /* positional args */ }],
  execute: create
};
```

### Migration Considerations:
- Current structure could map well to Stricli patterns
- Type safety would require TypeScript migration
- Command organization would benefit from route maps

## Example: Clever-Tools Create Command in Stricli

Based on the analysis, here's how the `clever create` command would look using Stricli:

```typescript
import { buildCommand, flag, positional, buildRouteMap } from '@stricli/core';

// Type definitions
interface CreateFlags {
  type: string;
  region: string;
  github?: string;
  task?: string;
  color: boolean;
  'update-notifier': boolean;
  verbose: boolean;
  org?: string;
  alias?: string;
  format: 'human' | 'json';
}

// Parsers
const nonEmptyStringParser = (input: string): string => {
  if (!input.trim()) {
    throw new Error('Value cannot be empty');
  }
  return input;
};

// Command definition
const createCommand = buildCommand({
  name: 'create',
  docs: {
    brief: 'Create an application',
    description: 'Create a new application with the specified configuration'
  },
  flags: {
    type: flag({
      kind: 'string',
      brief: 'Instance type',
      required: true,
      aliases: ['t'],
      // Could include autocomplete function
      completions: async () => await listAvailableTypes()
    }),
    region: flag({
      kind: 'string', 
      brief: 'Region, can be ${...}',
      default: 'par',
      aliases: ['r'],
      completions: async () => await listAvailableZones()
    }),
    github: flag({
      kind: 'string',
      brief: 'GitHub application to use for deployments',
      placeholder: 'OWNER/REPO'
    }),
    task: flag({
      kind: 'string',
      brief: 'The application launch as a task executing the given command, then stopped',
      aliases: ['T'],
      parser: nonEmptyStringParser,
      placeholder: 'command'
    }),
    color: flag({
      kind: 'boolean',
      brief: 'Enable color output',
      default: true
    }),
    'update-notifier': flag({
      kind: 'boolean', 
      brief: 'Enable update notifications',
      default: true
    }),
    verbose: flag({
      kind: 'boolean',
      brief: 'Enable verbose output',
      aliases: ['v']
    }),
    org: flag({
      kind: 'string',
      brief: 'Organization ID or name'
    }),
    alias: flag({
      kind: 'string',
      brief: 'Application alias'
    }),
    format: flag({
      kind: 'enum',
      values: ['human', 'json'] as const,
      brief: 'Output format',
      default: 'human' as const
    })
  },
  positional: {
    kind: 'tuple',
    elements: [
      positional({
        kind: 'string',
        brief: 'Application name',
        optional: true,
        placeholder: 'app-name'
      })
    ]
  }
});

// Implementation function
async function createImpl(
  flags: CreateFlags,
  appName?: string
): Promise<void> {
  const { type: typeName } = flags;
  const { org: orgaIdOrName, alias, region, github: githubOwnerRepo, format, task: taskCommand } = flags;
  
  // Use current directory name if app name not provided
  const name = appName || getCurrentDirectoryName();
  
  // Implementation logic...
  const app = await Application.create(name, typeName, region, orgaIdOrName, github, isTask, envVars);
  
  // Output formatting based on flags.format
  switch (format) {
    case 'json':
      console.log(JSON.stringify({
        id: app.id,
        name: app.name,
        executedAs: app.instance.lifetime,
        env: app.env,
        deployUrl: app.deployUrl,
      }));
      break;
    case 'human':
    default:
      await displayAppCreation(app, alias, github, taskCommand);
  }
}

// Bind implementation to command
const createCommandComplete = createCommand(createImpl);

// Integration into larger CLI with route map
const cleverToolsApp = buildRouteMap({
  routes: {
    create: createCommandComplete,
    deploy: deployCommand,
    delete: deleteCommand,
    // ... other commands
  },
  docs: {
    brief: 'Clever Cloud CLI tools',
    description: 'Command-line interface for managing Clever Cloud applications'
  }
});

export { cleverToolsApp };
```

### Alternative Structure with Subcommands:

```typescript
// For more complex organization
const appCommands = buildRouteMap({
  routes: {
    create: createCommand,
    deploy: deployCommand,
    delete: deleteCommand,
  },
  docs: {
    brief: 'Application management commands'
  }
});

const cleverCli = buildRouteMap({
  routes: {
    app: appCommands,
    addon: addonCommands,
    tokens: tokenCommands,
    // ...
  },
  docs: {
    brief: 'Clever Cloud CLI'
  }
});
```

## Recommendations

### For Adoption:
1. **Gradual Migration**: Start with new commands in Stricli while maintaining existing ones
2. **TypeScript First**: Full benefits require TypeScript adoption
3. **Documentation**: Invest in internal documentation and examples
4. **Team Training**: Ensure team understands TypeScript and Stricli patterns

### Best Practices:
1. Use route maps for logical command organization
2. Leverage type safety for better developer experience
3. Implement comprehensive help text and descriptions
4. Use autocomplete functions for better UX
5. Structure commands for code splitting benefits

## Conclusion

Stricli represents a modern approach to CLI development that prioritizes type safety, performance, and developer experience. While it requires TypeScript knowledge and has a learning curve, it offers significant benefits for complex CLI applications like clever-tools. The framework's emphasis on type safety, lazy loading, and clean architecture makes it well-suited for large-scale CLI applications that need to be maintainable and extensible.

For clever-tools specifically, Stricli could provide better type safety, improved autocomplete, and cleaner command organization, though the migration would require adopting TypeScript and restructuring the existing command definitions.