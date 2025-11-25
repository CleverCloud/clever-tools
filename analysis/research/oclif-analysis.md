# oclif CLI Framework Analysis

## Overview

oclif is a modern, open-source CLI framework built with Node.js and TypeScript. It's developed by Heroku/Salesforce and is used to build their own CLIs as well as many other popular command-line tools.

## Key Features

- **TypeScript First**: Built with TypeScript support from the ground up
- **Plugin Architecture**: Extensible plugin system for modular functionality
- **Auto-documentation**: Automatic help generation and documentation
- **Multi-command Support**: Supports both single-command and multi-command CLIs
- **Modern Node.js**: Requires Node 18+ and uses modern JavaScript features
- **JSON Output**: Built-in support for structured JSON output

## Command Structure Analysis

### 1. Command Definition

Commands in oclif extend the base `Command` class and require minimal boilerplate:

```typescript
import { Command } from '@oclif/core'

export class MyCommand extends Command {
  static description = 'Description of this command'
  static summary = 'Brief summary'
  static examples = [
    '$ mycli command --flag value',
    '$ mycli command arg1 arg2'
  ]
  
  async run(): Promise<void> {
    // Command implementation
  }
}
```

**Key Properties:**
- `description`: Detailed command explanation
- `summary`: Brief overview for help listings
- `examples`: Usage examples with optional descriptions
- `hidden`: Hide commands from help output
- `usage`: Custom usage string

### 2. Command Organization

Commands can be organized hierarchically using directory structure:
- Single commands: `src/commands/hello.ts`
- Nested commands: `src/commands/hello/world.ts` (creates `mycli hello world`)

## Flags/Options Analysis

### 3. Flag Definition

Flags are defined using the `Flags` import from `@oclif/core`:

```typescript
import { Command, Flags } from '@oclif/core'

export class MyCommand extends Command {
  static flags = {
    // String flag with alias
    name: Flags.string({
      char: 'n',
      description: 'Name to use',
      required: true,
      default: 'world'
    }),
    
    // Boolean flag
    force: Flags.boolean({
      char: 'f',
      description: 'Force the operation'
    }),
    
    // Multiple values
    tags: Flags.string({
      char: 't',
      description: 'Tags to apply',
      multiple: true
    }),
    
    // Restricted options
    format: Flags.string({
      options: ['json', 'yaml', 'table'],
      default: 'table'
    })
  }
}
```

### 4. Flag Types and Features

**Available Types:**
- `string`: Text input
- `boolean`: True/false flags
- `integer`: Numeric input
- `url`: URL validation
- `file`: File path validation
- `directory`: Directory path validation
- Custom types with parsing functions

**Advanced Features:**
- **Aliases**: Short character aliases (`char: 'f'`)
- **Environment Variables**: Link to env vars (`env: 'MY_VAR'`)
- **Validation**: Custom parsing and validation functions
- **Relationships**: Dependencies, exclusions, exactly-one constraints
- **Multiple Values**: Accept multiple instances of the same flag

### 5. Flag Relationships

```typescript
static flags = {
  input: Flags.string({
    description: 'Input file',
    relationships: [
      { type: 'dependsOn', flags: ['format'] }
    ]
  }),
  json: Flags.boolean({
    relationships: [
      { type: 'exclusive', flags: ['yaml', 'table'] }
    ]
  }),
  auth: Flags.string({
    relationships: [
      { type: 'exactlyOne', flags: ['token', 'key', 'password'] }
    ]
  })
}
```

## Arguments Analysis

### 6. Positional Arguments

Arguments are defined using the `Args` import:

```typescript
import { Command, Args } from '@oclif/core'

export class MyCommand extends Command {
  static args = {
    file: Args.string({
      description: 'File to process',
      required: true
    }),
    output: Args.string({
      description: 'Output location',
      default: 'output.txt'
    })
  }
}
```

### 7. Argument Features

**Argument Types:**
- Same types as flags: string, integer, boolean, url, file, directory, custom
- **Required/Optional**: Control with `required: true/false`
- **Default Values**: Static or dynamic defaults
- **Validation**: Custom parsing functions

**Variadic Arguments:**
```typescript
export class MyCommand extends Command {
  static strict = false  // Allow variable arguments
  
  async run(): Promise<void> {
    const { argv } = await this.parse(MyCommand)
    // argv contains all arguments as array
  }
}
```

## Naming Conventions and Best Practices

### 8. Naming Standards

**Commands:**
- Use kebab-case for multi-word commands: `user-create`, `db-migrate`
- Organize hierarchically: `user create`, `user delete`
- Keep names descriptive but concise

**Flags:**
- Use full descriptive names: `--output-file`, `--max-retries`
- Single character aliases for common flags: `-o`, `-v`, `-f`
- Boolean flags should be positive: `--verbose` not `--no-quiet`

**Arguments:**
- Use descriptive names: `source-file`, `target-directory`
- Consider optional vs required carefully
- Provide helpful descriptions

### 9. Aliases and Case Sensitivity

**Flag Aliases:**
- Single character only: `char: 'f'`
- Case sensitive: `-f` and `-F` are different
- No multi-character aliases supported natively

**Command Aliases:**
```typescript
export class MyCommand extends Command {
  static aliases = ['alias1', 'alias2']
}
```

## Format and Parser Handling

### 10. JSON Output Support

oclif provides built-in JSON output support:

```typescript
export class MyCommand extends Command {
  static enableJsonFlag = true
  
  async run(): Promise<{ result: string }> {
    this.log('Human readable output')
    return { result: 'data for JSON output' }
  }
}
```

Usage:
- Normal: `mycli command` (shows logs)
- JSON: `mycli command --json` (returns JSON, suppresses logs)

### 11. Custom Parsers

```typescript
static flags = {
  port: Flags.custom<number>({
    parse: async (input) => {
      const port = parseInt(input, 10)
      if (port < 1 || port > 65535) {
        throw new Error('Port must be between 1 and 65535')
      }
      return port
    }
  })
}
```

## Benefits and Limitations

### 12. Benefits

**Strengths:**
1. **Modern Architecture**: Built with TypeScript, excellent type safety
2. **Rich Feature Set**: Comprehensive flag/argument handling with relationships
3. **Plugin System**: Extensible architecture for complex CLIs
4. **Auto-documentation**: Automatic help generation and man pages
5. **JSON Support**: Built-in structured output
6. **Testing**: Excellent testing utilities included
7. **Performance**: Fast startup and execution
8. **Community**: Strong ecosystem and corporate backing (Salesforce)
9. **Standards Compliance**: Follows Unix CLI conventions
10. **Validation**: Rich validation and error handling

**Advanced Features:**
- Hook system for plugin integration
- Theme support for customizable output
- Automatic update notifications
- Shell completion generation
- Multi-platform support

### 13. Limitations

**Potential Drawbacks:**
1. **Learning Curve**: More complex than simple argument parsers
2. **Bundle Size**: Larger footprint than minimal libraries
3. **Node.js Dependency**: Requires Node.js runtime
4. **TypeScript Focus**: Less ergonomic for pure JavaScript projects
5. **Flag Alias Limitations**: Only single character aliases
6. **Migration Complexity**: Significant refactoring needed from other frameworks
7. **Opinionated**: Strong conventions may not fit all use cases

## Example: clever-tools create Command in oclif

### 14. Current clever-tools Structure

```javascript
// Current structure
export const createCommand = {
  name: 'create',
  description: 'Create an application',
  opts: {
    type: { aliases: ['t'], required: true },
    region: { aliases: ['r'], default: 'par' },
    github: { description: 'GitHub application to use' },
    task: { aliases: ['T'] },
    // ... global options
  },
  args: [{
    name: 'app-name',
    description: 'Application name (optional)'
  }]
}
```

### 15. oclif Implementation

```typescript
import { Command, Args, Flags } from '@oclif/core'
import { listAvailableTypes, listAvailableZones } from '../models/application.js'

export class CreateCommand extends Command {
  static description = 'Create an application'
  static summary = 'Create a new Clever Cloud application'
  
  static examples = [
    '$ clever create my-app --type node --region par',
    '$ clever create --type static-apache --github owner/repo',
    '$ clever create my-task --type node --task "npm run build"'
  ]

  static flags = {
    // Required type flag
    type: Flags.string({
      char: 't',
      description: 'Instance type (node, php, python, etc.)',
      required: true,
      options: async () => await listAvailableTypes()
    }),
    
    // Region with default
    region: Flags.string({
      char: 'r', 
      description: 'Region where to deploy the application',
      default: 'par',
      options: async () => await listAvailableZones()
    }),
    
    // GitHub integration
    github: Flags.string({
      description: 'GitHub repository for automatic deployments',
      helpValue: 'OWNER/REPO'
    }),
    
    // Task mode
    task: Flags.string({
      char: 'T',
      description: 'Run as task executing the given command',
      helpValue: 'command'
    }),
    
    // Global flags
    org: Flags.string({
      description: 'Organization ID or name',
      helpValue: 'ORG_ID'
    }),
    
    alias: Flags.string({
      description: 'Alias for the application',
      helpValue: 'ALIAS'
    }),
    
    format: Flags.string({
      description: 'Output format',
      options: ['human', 'json'],
      default: 'human'
    }),
    
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output'
    }),
    
    color: Flags.boolean({
      description: 'Enable colored output',
      default: true,
      allowNo: true  // Supports --no-color
    })
  }

  static args = {
    'app-name': Args.string({
      description: 'Application name (defaults to current directory name)',
      required: false
    })
  }

  // Enable JSON output support
  static enableJsonFlag = true

  async run(): Promise<any> {
    const { args, flags } = await this.parse(CreateCommand)
    
    // Extract values
    const appName = args['app-name'] || this.getCurrentDirectoryName()
    const { 
      type, 
      region, 
      github, 
      task, 
      org, 
      alias, 
      format,
      verbose 
    } = flags

    try {
      // Validation
      if (github && !github.includes('/')) {
        this.error('GitHub repository must be in OWNER/REPO format')
      }

      // Create application logic
      const app = await this.createApplication({
        name: appName,
        type,
        region,
        github: github ? this.parseGitHub(github) : null,
        task,
        org,
        alias
      })

      // Output handling
      if (format === 'json') {
        return {
          id: app.id,
          name: app.name,
          type: app.type,
          region: app.region,
          deployUrl: app.deployUrl
        }
      } else {
        this.log(`✅ Application ${app.name} created successfully!`)
        this.log(`📍 Region: ${app.region}`)
        this.log(`🔗 Deploy URL: ${app.deployUrl}`)
        
        if (github) {
          this.log(`📦 GitHub: ${github}`)
        }
        
        if (task) {
          this.log(`⚡ Task: ${task}`)
        }
      }

    } catch (error) {
      this.error(`Failed to create application: ${error.message}`, {
        exit: 1,
        suggestions: [
          'Check your authentication with: clever auth',
          'Verify the application type with: clever types'
        ]
      })
    }
  }

  private getCurrentDirectoryName(): string {
    return require('path').basename(process.cwd())
  }

  private parseGitHub(github: string): { owner: string; name: string } {
    const [owner, name] = github.split('/')
    return { owner, name }
  }

  private async createApplication(params: any): Promise<any> {
    // Implementation would go here
    // This would call the existing create logic
    throw new Error('Implementation needed')
  }
}
```

### 16. Alternative Simplified Structure

For a more concise approach, oclif also supports inline flag definitions:

```typescript
export class CreateCommand extends Command {
  static description = 'Create an application'
  
  static flags = {
    type: Flags.string({ char: 't', required: true }),
    region: Flags.string({ char: 'r', default: 'par' }),
    github: Flags.string(),
    task: Flags.string({ char: 'T' })
  }
  
  static args = {
    name: Args.string({ required: false })
  }

  async run() {
    const { args, flags } = await this.parse(CreateCommand)
    // Implementation...
  }
}
```

## Migration Considerations

### 17. Migration Strategy

**From clever-tools to oclif:**

1. **Command Structure**: Each command becomes a class extending `Command`
2. **Options → Flags**: Direct mapping with enhanced type safety
3. **Arguments**: Similar structure but with better validation
4. **Global Options**: Can be shared via base classes or mixins
5. **Validation**: More robust built-in validation
6. **Output**: Better JSON support and formatting options

**Benefits of Migration:**
- Better type safety and development experience
- More robust flag/argument handling
- Built-in testing utilities
- Auto-generated documentation
- Plugin architecture for extensibility
- Better error handling and user experience

**Migration Challenges:**
- Significant refactoring required
- Learning curve for development team
- Potential breaking changes for existing users
- Need to rewrite all command implementations

## Conclusion

oclif is a powerful, feature-rich CLI framework that provides excellent developer experience and robust functionality. It would be a significant upgrade for clever-tools in terms of type safety, validation, documentation, and extensibility. However, the migration would require substantial effort and careful planning to maintain backward compatibility and user experience.

The framework's strengths in TypeScript support, plugin architecture, and comprehensive feature set make it an excellent choice for complex CLIs like clever-tools, but the migration cost and learning curve should be carefully considered.