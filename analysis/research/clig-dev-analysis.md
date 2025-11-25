# CLIG.dev Analysis and Recommendations for Clever Tools

## Overview

This document analyzes the CLI guidelines from [clig.dev](https://clig.dev/) and provides recommendations for improving the `clever create` command based on these best practices.

## CLIG.dev Core Principles

### 1. Human-First Design
- **Principle**: "Design your CLI for humans first, and machines second"
- **Focus**: Prioritize human usability over machine interaction
- **Goal**: Make commands discoverable, intuitive, and conversational

### 2. Command Structure Best Practices

#### Prefer Flags Over Positional Arguments
- **Rule**: "Prefer flags to args"
- **Rationale**: Flags are more explicit and less prone to ordering errors
- **Exception**: Simple file-based actions can use multiple arguments
- **Limit**: Avoid more than two arguments for different purposes

#### Standard Flag Conventions
CLIG.dev recommends following these standard flag patterns:
- `-a`, `--all`: All items
- `-d`, `--debug`: Debugging output  
- `-f`, `--force`: Force action
- `-h`, `--help`: Help
- `-n`, `--dry-run`: Simulate without executing
- `-q`, `--quiet`: Reduce output
- `-v`, `--verbose`: Verbose output
- `--json`: JSON output
- `--plain`: Consistent, scriptable output

### 3. Configuration and Defaults

#### Configuration Precedence (highest to lowest)
1. Command-line flags
2. Environment variables
3. Project-level configuration files
4. User-level configuration files
5. System-wide configuration files

#### Default Value Strategy
- **Rule**: "Make the default the right thing for most users"
- **Approach**: Choose sensible defaults that work for 80% of use cases
- **Validation**: Always validate user input and provide clear error messages

### 4. Output and User Experience

#### Output Streams
- **stdout**: Primary output and data
- **stderr**: Messages, errors, and progress indicators
- **Color**: Use intentionally, disable when:
  - Not in an interactive terminal
  - `NO_COLOR` environment variable is set
  - `TERM` is "dumb"

#### Machine-Readable Formats
- **JSON**: Use `--json` flag for structured data output
- **Plain**: Use `--plain` for consistent, scriptable output
- **Human**: Default to human-readable format

#### Error Handling
- Validate user input early
- Catch and rewrite technical errors for humans
- Provide clear, concise error messages
- Suggest corrections when possible
- Include debug information for unexpected errors

### 5. Help and Documentation

#### Help Text Best Practices
- Lead with examples
- Provide comprehensive help text
- Suggest next commands
- Make commands discoverable
- Offer both web and terminal-based documentation

### 6. Robustness and Reliability

#### Operational Resilience
- Handle interruptions gracefully (SIGINT, SIGTERM)
- Implement appropriate timeouts
- Make operations recoverable where possible
- Be explicit about state changes
- Provide progress indicators for long-running tasks

## Current Clever Tools Create Command Analysis

### Current Structure
```javascript
clever create [app-name] --type <type> [options]
```

### Current Options Analysis

| Option | Alias | Required | Default | CLIG Compliance |
|--------|-------|----------|---------|-----------------|
| `--type` | `-t` | ✅ Yes | None | ❌ Should have sensible default |
| `--region` | `-r` | ❌ No | 'par' | ✅ Good default |
| `--github` | None | ❌ No | None | ⚠️ Could use standard alias |
| `--task` | `-T` | ❌ No | None | ❌ Uppercase alias unconventional |
| `--org` | `-o`, `--owner` | ❌ No | None | ✅ Standard aliases |
| `--alias` | `-a` | ❌ No | None | ✅ Standard alias |
| `--format` | `-F` | ❌ No | 'human' | ⚠️ Should use `--json` |
| `--verbose` | `-v` | ❌ No | None | ✅ Standard convention |
| `--color` | None | ❌ No | true | ✅ Good default |

### Current Strengths
1. ✅ **Good use of aliases**: Most options follow standard conventions (`-v`, `-a`, `-o`)
2. ✅ **Sensible defaults**: Region defaults to 'par', format to 'human'
3. ✅ **Optional positional argument**: App name is optional with logical fallback
4. ✅ **Machine-readable output**: Supports JSON format
5. ✅ **Auto-completion**: Implements completion for types and zones
6. ✅ **Good error handling**: Validates input and provides helpful messages

### Areas for Improvement

#### 1. Required Options Without Defaults
- **Issue**: `--type` is required but has no default
- **CLIG Principle Violation**: "Make the default the right thing for most users"
- **Recommendation**: Provide an intelligent default or make it optional with prompting

#### 2. Inconsistent Flag Naming
- **Issue**: `--task` uses uppercase alias `-T`
- **CLIG Principle Violation**: Standard conventions use lowercase
- **Recommendation**: Change to `-t` or remove alias to avoid conflict

#### 3. Non-Standard JSON Flag
- **Issue**: Uses `--format json` instead of `--json`
- **CLIG Principle Violation**: Standard convention is `--json` flag
- **Recommendation**: Add `--json` flag alongside `--format` for compatibility

#### 4. Missing Standard Flags
- **Missing**: `--dry-run` / `-n` for simulation
- **Missing**: `--quiet` / `-q` for reduced output
- **Missing**: `--force` / `-f` for overriding conflicts

## Recommended Improvements

### 1. Enhanced Create Command Structure

```bash
# Current
clever create [app-name] --type <type> [options]

# Improved (CLIG-compliant)
clever create [app-name] [options]
```

### 2. Improved Option Design

```javascript
// Recommended option improvements
{
  // Primary options
  type: {
    name: 'type',
    description: 'Application type (e.g., node, php, static)',
    aliases: ['t'],
    default: 'node', // Intelligent default for most common use case
    required: false,
    complete: listAvailableTypes
  },
  
  region: {
    name: 'region', 
    description: 'Deployment region',
    aliases: ['r'],
    default: 'par',
    required: false,
    complete: listAvailableZones
  },
  
  // Standard CLIG flags
  json: {
    name: 'json',
    description: 'Output in JSON format',
    type: 'flag',
    aliases: null,
    default: false
  },
  
  'dry-run': {
    name: 'dry-run',
    description: 'Show what would be created without actually creating',
    type: 'flag', 
    aliases: ['n'],
    default: false
  },
  
  quiet: {
    name: 'quiet',
    description: 'Reduce output to essential information only',
    type: 'flag',
    aliases: ['q'], 
    default: false
  },
  
  force: {
    name: 'force',
    description: 'Override conflicts and continue',
    type: 'flag',
    aliases: ['f'],
    default: false
  },
  
  // Renamed for consistency
  task: {
    name: 'task',
    description: 'Run as a task with the specified command',
    aliases: ['T'], // Keep for backward compatibility, but document as deprecated
    metavar: 'command'
  },
  
  // GitHub integration
  github: {
    name: 'github',
    description: 'GitHub repository for deployments (OWNER/REPO)',
    aliases: ['g'], // Add standard alias
    metavar: 'OWNER/REPO'
  }
}
```

### 3. Improved User Experience

#### Enhanced Help Text (CLIG-style)
```
Usage: clever create [app-name] [options]

Create a new application on Clever Cloud.

Examples:
  clever create                           # Create app with current directory name
  clever create my-app                    # Create app with specific name
  clever create --type php --region rbx   # Create PHP app in Roubaix
  clever create --github user/repo        # Create with GitHub integration
  clever create --task "npm run build"    # Create as a build task
  clever create --dry-run                 # Preview what would be created

Options:
  -t, --type TYPE       Application type [default: node]
  -r, --region REGION   Deployment region [default: par] 
  -g, --github REPO     GitHub repository (OWNER/REPO)
      --task COMMAND    Run as task with command
  -a, --alias ALIAS     Short name for the application
  -o, --org ORG         Target organization

Output Options:
      --json            Output in JSON format
  -q, --quiet           Reduce output
  -v, --verbose         Verbose output
      --no-color        Disable colored output

Simulation Options:
  -n, --dry-run         Show what would be created
  -f, --force           Override conflicts

Global Options:
  -h, --help            Show help
      --version         Show version
```

#### Better Error Messages
```javascript
// Current error (technical)
"Error: Missing required option --type"

// CLIG-style error (human-friendly)
"Application type is required. Use --type to specify (e.g., --type node).
Run 'clever create --help' for examples."
```

#### Improved Progress Indicators
```javascript
// For long operations
console.log('Creating application...')
console.log('⠋ Setting up infrastructure')  
console.log('✓ Infrastructure ready')
console.log('⠋ Configuring deployment')
console.log('✓ Deployment configured') 
console.log('✓ Application created successfully!')
```

### 4. Configuration File Support

Following CLIG principles, support configuration files:

```yaml
# ~/.config/clever-tools/config.yml
defaults:
  type: node
  region: par
  org: my-org
  
github:
  auto_detect: true  # Auto-detect GitHub repo from git remote
```

### 5. Environment Variable Support

```bash
# Standard environment variables
export CLEVER_DEFAULT_TYPE=node
export CLEVER_DEFAULT_REGION=rbx  
export CLEVER_ORG=my-org
export CLEVER_OUTPUT_FORMAT=json
```

## Benefits of Following CLIG.dev Guidelines

### 1. **Improved Discoverability**
- Standard flag conventions make the CLI more intuitive
- Users familiar with other CLI tools can predict flag behavior
- Consistent patterns reduce learning curve

### 2. **Better User Experience**
- Sensible defaults reduce required typing
- Clear error messages help users recover from mistakes
- Progress indicators improve perception of responsiveness

### 3. **Enhanced Automation**
- `--json` flag enables easy scripting and integration
- `--dry-run` allows safe testing of commands
- `--quiet` flag reduces noise in automated environments

### 4. **Future-Proof Design**
- Standard conventions make future enhancements predictable
- Consistent patterns simplify maintenance and documentation
- Better alignment with user expectations

### 5. **Accessibility and Inclusion**
- Clear, human-readable defaults
- Multiple output formats for different needs
- Comprehensive help text with examples

## Limitations and Considerations

### 1. **Backward Compatibility**
- **Challenge**: Changing existing flag names or behavior may break existing scripts
- **Mitigation**: Support both old and new flags with deprecation warnings
- **Timeline**: Gradual migration over multiple releases

### 2. **Implementation Complexity**
- **Challenge**: Adding features like `--dry-run` requires significant backend support
- **Consideration**: Prioritize changes based on user impact vs. implementation cost

### 3. **Cultural Context**
- **Limitation**: CLIG.dev focuses on Unix/Linux conventions
- **Consideration**: Ensure changes work well on Windows and other platforms

### 4. **Learning Curve for Developers**
- **Challenge**: Team needs to learn and apply new conventions consistently
- **Mitigation**: Provide clear documentation and code review guidelines

## Implementation Recommendations

### Phase 1: Quick Wins (Low Risk, High Impact)
1. Add `--json` flag alongside existing `--format` option
2. Add `--quiet` flag for reduced output  
3. Improve help text with examples
4. Add intelligent default for `--type` (e.g., 'node')

### Phase 2: Standard Compliance (Medium Risk, High Impact)  
1. Add `--dry-run` functionality
2. Add `--force` flag for conflict resolution
3. Improve error messages to be more human-friendly
4. Add progress indicators for long operations

### Phase 3: Advanced Features (Higher Risk, Medium Impact)
1. Configuration file support
2. Environment variable support  
3. Deprecate non-standard aliases (with warnings)
4. Enhanced auto-completion

## Example: CLIG-Compliant Create Command

```bash
# Simple usage with intelligent defaults
$ clever create my-app
Creating Node.js application 'my-app' in region 'par'...
✓ Application created successfully!

# Explicit options
$ clever create web-frontend --type static --region rbx --github myorg/frontend
Creating static application 'web-frontend' in region 'rbx'...
✓ GitHub integration configured for myorg/frontend
✓ Application created successfully!

# Dry run to preview
$ clever create test-app --dry-run
Would create:
  Name: test-app
  Type: node (default)
  Region: par (default)
  GitHub: none
  Organization: personal (default)

# JSON output for scripting  
$ clever create api-service --json
{
  "id": "app_12345",
  "name": "api-service", 
  "type": "node",
  "region": "par",
  "deployUrl": "https://app_12345.clever.app"
}

# Quiet mode for automation
$ clever create batch-job --quiet --task "npm run process"
✓ Task application 'batch-job' created
```

## Conclusion

Following CLIG.dev guidelines would significantly improve the user experience of the `clever create` command by:

1. **Reducing cognitive load** through standard conventions
2. **Improving automation support** with consistent output formats
3. **Enhancing discoverability** through better help and examples  
4. **Increasing reliability** through better error handling and validation

The recommended changes should be implemented gradually to maintain backward compatibility while moving toward a more user-friendly and standards-compliant CLI interface.

The investment in following these guidelines will pay dividends in:
- Reduced support requests due to clearer interfaces
- Faster user adoption due to familiar patterns
- Better developer experience leading to increased usage
- Future-proof design that aligns with industry best practices