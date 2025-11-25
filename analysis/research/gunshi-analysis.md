# Gunshi CLI Framework Analysis

## Overview

Gunshi is a modern JavaScript CLI framework designed for building command-line interfaces with TypeScript support, declarative configuration, and type-safe argument parsing. It emphasizes simplicity, modularity, and developer experience.

## 1. Command Structure and Description

### Command Definition Pattern
Commands in Gunshi are defined as declarative configuration objects with the following core structure:

```javascript
const command = {
  name: 'command-name',
  description: 'Command description',
  args: { /* argument definitions */ },
  run: (ctx) => { /* execution logic */ }
}
```

### Key Properties
- **name**: String identifier for the command
- **description**: Human-readable explanation of the command's purpose
- **args**: Object defining all input parameters (options, flags, positional args)
- **run**: Execution function that receives parsed context

### Command Invocation
Commands are executed using the `cli()` function:

```javascript
cli(process.argv, command, { name: 'my-cli', version: '1.0.0' })
```

## 2. Options/Flags Description and Naming Conventions

### Option Definition Structure
```javascript
args: {
  optionName: {
    type: 'string' | 'number' | 'boolean',
    short: 'n',           // Single character alias
    description: 'Option description',
    default: 'value',     // Default value
    required: true        // Can be implied by absence of default
  }
}
```

### Naming Conventions Analysis
- **Options**: Use camelCase for JavaScript property names
- **CLI Usage**: Likely converted to kebab-case for command-line usage (standard practice)
- **Short Aliases**: Single character shortcuts using `short` property
- **Type System**: Built-in support for string, number, and boolean types

### Flag vs Option Distinction
- **Options**: Accept values, defined with `type: 'string'` or `type: 'number'`
- **Flags**: Boolean switches, defined with `type: 'boolean'`

## 3. Positional Arguments

### Current Analysis Limitation
The documentation and examples primarily show named options but don't clearly demonstrate positional argument handling. The framework appears to focus more on named parameters than positional ones, which is common in modern CLI design.

### Inferred Pattern
Based on typical CLI patterns, positional arguments would likely be:
- Defined in the `args` object without explicit names
- Accessed through the context parameter in the `run` function
- Potentially handled through array-like access or special properties

## 4. Required/Default Values Handling

### Required Values
- **Explicit**: Set `required: true` in the argument definition
- **Implicit**: Arguments without default values may be considered required
- **Validation**: Framework likely validates required arguments before execution

### Default Values
- **Simple Defaults**: Set using `default: value` property
- **Type Consistency**: Default values should match the declared type
- **Fallback Behavior**: Missing arguments fall back to default values

```javascript
args: {
  region: {
    type: 'string',
    default: 'par',        // Default provided
    description: 'Target region'
  },
  type: {
    type: 'string',
    required: true,        // No default, explicitly required
    description: 'Application type'
  }
}
```

## 5. Aliases Handling

### Alias System
- **Short Aliases**: Single character aliases via `short` property
- **Case Sensitivity**: Likely case-sensitive (standard CLI behavior)
- **Length Restrictions**: Short aliases limited to single characters
- **Multiple Aliases**: Not clearly documented, may be limited to one short alias per option

### Example
```javascript
args: {
  verbose: {
    type: 'boolean',
    short: 'v',           // Creates -v alias for --verbose
    description: 'Enable verbose output'
  }
}
```

## 6. Formats/Parsers Analysis

### Type System
Gunshi provides built-in type parsing for:
- **string**: Text values
- **number**: Numeric values
- **boolean**: Flag/switch values

### Advanced Parsing
The framework appears to support:
- **Automatic Type Conversion**: Based on declared type
- **Custom Parsers**: Likely extensible for complex validation
- **Error Handling**: Type validation and parsing error management

### Validation
- Type-safe parsing ensures arguments match expected types
- Automatic validation of required vs optional parameters
- Built-in error messages for parsing failures

## 7. Benefits and Limitations

### Benefits

#### 1. **Developer Experience**
- **TypeScript Support**: Full type safety and IDE integration
- **Declarative Configuration**: Clean, readable command definitions
- **Automatic Help Generation**: Usage documentation generated from definitions
- **Type-Safe Parsing**: Compile-time and runtime type checking

#### 2. **Modern Architecture**
- **Universal Runtime**: Works in different JavaScript environments
- **Lazy Loading**: Commands can be loaded on-demand
- **Async Support**: Native support for asynchronous operations
- **Modular Design**: Composable command structure

#### 3. **Internationalization**
- **Built-in i18n**: Native support for multiple languages
- **Customizable Messages**: Configurable error and help messages

#### 4. **Simplicity**
- **Minimal Boilerplate**: Concise command definitions
- **Clear API**: Intuitive configuration structure
- **Automatic Features**: Help generation, validation, parsing

### Limitations

#### 1. **Documentation Gaps**
- **Limited Examples**: Complex use cases not well documented
- **API Reference**: Incomplete documentation of advanced features
- **Migration Guides**: Lack of comparison with other frameworks

#### 2. **Feature Uncertainty**
- **Positional Arguments**: Unclear handling of positional parameters
- **Complex Validation**: Advanced validation patterns not documented
- **Subcommands**: Composable sub-commands mentioned but not detailed
- **Multiple Aliases**: Support for multiple aliases per option unclear

#### 3. **Ecosystem Maturity**
- **Community Size**: Smaller ecosystem compared to established frameworks
- **Plugin System**: Extension mechanisms not clearly documented
- **Third-party Integration**: Limited examples of integration with other tools

#### 4. **Advanced Features**
- **Complex Parsing**: Custom parser implementation not well documented
- **Error Handling**: Advanced error handling patterns unclear
- **Configuration**: Global CLI configuration options limited

## 8. Clever-Tools Create Command in Gunshi

### Current Implementation Analysis
The clever-tools `create` command currently uses a complex object-based structure with detailed option definitions including aliases, parsers, and completion functions.

### Gunshi Implementation

```javascript
import { cli } from 'gunshi';
import { listAvailableTypes, listAvailableZones } from '../models/application.js';

const createCommand = {
  name: 'create',
  description: 'Create an application',
  args: {
    // Required type option with alias
    type: {
      type: 'string',
      short: 't',
      description: 'Instance type',
      required: true
      // Note: Gunshi may not support custom completion functions
      // complete: listAvailableTypes would need framework extension
    },
    
    // Region with default value and alias
    region: {
      type: 'string',
      short: 'r',
      description: 'Region, can be par, rbx, gra, etc.',
      default: 'par'
      // complete: listAvailableZones
    },
    
    // GitHub integration option
    github: {
      type: 'string',
      description: 'GitHub application to use for deployments (OWNER/REPO format)'
      // No alias specified in original
    },
    
    // Task command option
    task: {
      type: 'string',
      short: 'T',
      description: 'The application launch as a task executing the given command, then stopped'
      // Custom parser may need framework extension
    },
    
    // Global options
    color: {
      type: 'boolean',
      description: 'Choose whether to print colors or not',
      default: true
    },
    
    verbose: {
      type: 'boolean',
      short: 'v',
      description: 'Verbose output'
    },
    
    org: {
      type: 'string',
      short: 'o',
      description: 'Organisation to target by its ID or name'
      // Multiple aliases (o, owner) might not be supported
    },
    
    alias: {
      type: 'string',
      short: 'a',
      description: 'Short name for the application'
    },
    
    format: {
      type: 'string',
      short: 'F',
      description: 'Output format (human, json)',
      default: 'human'
    }
    
    // Note: Positional 'app-name' argument handling unclear in Gunshi
    // May need to be handled differently or through special property
  },
  
  async run(ctx) {
    // ctx contains parsed arguments
    const { type: typeName, region, github: githubOwnerRepo, task: taskCommand, 
            org: orgaIdOrName, alias, format, verbose, color } = ctx.args;
    
    // Access positional arguments (implementation unclear)
    // const appName = ctx.positional?.[0] || getCurrentDirectoryName();
    
    try {
      // Implementation logic here
      const app = await createApplication({
        name: appName,
        type: typeName,
        region,
        github: parseGithubRepo(githubOwnerRepo),
        task: taskCommand,
        org: orgaIdOrName,
        alias,
        format
      });
      
      await displayResult(app, format);
      
    } catch (error) {
      if (verbose) {
        console.error('Detailed error:', error);
      } else {
        console.error('Error:', error.message);
      }
      process.exit(1);
    }
  }
};

// CLI invocation
cli(process.argv, createCommand, { 
  name: 'clever', 
  version: '1.0.0' 
});
```

### Key Adaptations Required

#### 1. **Positional Arguments**
```javascript
// Current: Optional app-name positional argument
// Gunshi: May need special handling or different approach
// Possible solution: Make it a named option with default behavior

appName: {
  type: 'string',
  description: 'Application name (defaults to current directory)',
  // Could be handled in run() function logic
}
```

#### 2. **Multiple Aliases**
```javascript
// Current: org: ['o', 'owner']
// Gunshi: Only supports single 'short' alias
// Adaptation: Choose primary alias, document alternatives

org: {
  type: 'string',
  short: 'o',  // Primary alias only
  description: 'Organisation (alias: --owner not supported in Gunshi)'
}
```

#### 3. **Custom Parsers and Completion**
```javascript
// Current: Custom parsers and completion functions
// Gunshi: Basic type system only
// Adaptation: Handle validation in run() function

task: {
  type: 'string',
  short: 'T',
  description: 'Task command'
  // Custom nonEmptyStringParser would be handled in run()
},

async run(ctx) {
  const { task } = ctx.args;
  if (task !== undefined && task.trim() === '') {
    throw new Error('Task command cannot be empty');
  }
  // Continue with implementation
}
```

#### 4. **Advanced Option Features**
```javascript
// Current: metavar, complete functions, complex parsers
// Gunshi: Simplified option system
// Adaptation: Document expected formats in descriptions

github: {
  type: 'string',
  description: 'GitHub repository in OWNER/REPO format'
  // Original metavar: 'OWNER/REPO' incorporated into description
}
```

## Conclusion

Gunshi offers a modern, TypeScript-friendly approach to CLI development with excellent developer experience and clean declarative syntax. However, it may require significant adaptations for complex CLIs like clever-tools due to limitations in:

- Positional argument handling
- Multiple aliases per option
- Custom parsing and validation
- Advanced completion features

The framework excels for simpler CLI applications but may need extensions or workarounds for feature-rich tools that require advanced argument parsing capabilities. The trade-off is between simplicity/modern development experience and advanced CLI features.

For clever-tools, adopting Gunshi would require:
1. Restructuring positional arguments as named options
2. Simplifying alias systems
3. Moving custom validation into command logic
4. Potentially losing some advanced features like custom completion

The decision should weigh the benefits of modern development experience against the loss of current advanced CLI capabilities.