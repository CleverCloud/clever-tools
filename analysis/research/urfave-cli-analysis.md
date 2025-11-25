# urfave/cli Framework Analysis

## Overview

urfave/cli is a declarative, simple, fast, and fun package for building command line tools in Go. It emphasizes minimal dependencies (only Go standard library) and provides a comprehensive feature set for CLI development.

## 1. Command Structure and Description

### Basic Command Definition

Commands in urfave/cli are defined using the `Command` struct with key fields:

```go
type Command struct {
    Name        string
    Aliases     []string
    Usage       string
    Description string
    Flags       []Flag
    Commands    []*Command  // For subcommands
    Action      ActionFunc
}
```

### Example Command Structure

```go
cmd := &cli.Command{
    Name:        "create",
    Aliases:     []string{"c"},
    Usage:       "Create an application",
    Description: "Create a new application with specified parameters",
    Flags:       []cli.Flag{...},
    Commands:    []*cli.Command{...}, // Subcommands
    Action: func(ctx context.Context, cmd *cli.Command) error {
        // Command logic
        return nil
    },
}
```

### Nested Commands Support

urfave/cli supports unlimited nesting of subcommands:

```go
&cli.Command{
    Name: "app",
    Commands: []*cli.Command{
        {
            Name: "create",
            Commands: []*cli.Command{
                {
                    Name: "from-template",
                    Action: func(ctx context.Context, cmd *cli.Command) error {
                        return nil
                    },
                },
            },
        },
    },
}
```

## 2. Options/Flags Description and Naming Conventions

### Flag Types

urfave/cli supports comprehensive flag types:

- `StringFlag`
- `BoolFlag`
- `IntFlag`, `Int64Flag`, `UintFlag`
- `Float64Flag`
- `DurationFlag`
- `TimestampFlag`
- `StringSliceFlag`, `IntSliceFlag`

### Flag Definition Structure

```go
type StringFlag struct {
    Name        string
    Aliases     []string
    Usage       string
    Value       string      // Default value
    Required    bool
    Destination *string     // Variable to store value
    Action      ActionFunc  // Validation/processing
}
```

### Naming Conventions

- **Long names**: kebab-case (e.g., `--database-url`)
- **Short aliases**: single letters (e.g., `-d`)
- **Multiple aliases**: supported via `Aliases` slice
- **Case sensitivity**: flags are case-sensitive

### Flag Examples

```go
Flags: []cli.Flag{
    &cli.StringFlag{
        Name:     "type",
        Aliases:  []string{"t"},
        Usage:    "Application type",
        Required: true,
    },
    &cli.StringFlag{
        Name:    "region",
        Aliases: []string{"r"},
        Usage:   "Deployment region",
        Value:   "par",  // Default value
    },
    &cli.BoolFlag{
        Name:    "github",
        Usage:   "Enable GitHub integration",
    },
    &cli.StringFlag{
        Name:    "task",
        Aliases: []string{"T"},
        Usage:   "Task configuration",
    },
}
```

## 3. Positional Arguments

### Argument Access

Positional arguments are accessed via the `Args()` method:

```go
Action: func(ctx context.Context, cmd *cli.Command) error {
    // Get first argument
    appName := cmd.Args().Get(0)
    
    // Check if argument exists
    if cmd.NArg() > 0 {
        firstArg := cmd.Args().First()
    }
    
    // Get all arguments as slice
    allArgs := cmd.Args().Slice()
    
    return nil
}
```

### Argument Methods

- `cmd.Args().Get(index)` - Get argument by index (returns empty string if not found)
- `cmd.Args().First()` - Get first argument
- `cmd.Args().Present()` - Check if any arguments present
- `cmd.Args().Len()` - Number of arguments
- `cmd.Args().Slice()` - All arguments as slice

## 4. Required/Default Values

### Required Flags

```go
&cli.StringFlag{
    Name:     "type",
    Usage:    "Application type (required)",
    Required: true,  // Makes the flag mandatory
}
```

### Default Values

```go
&cli.StringFlag{
    Name:  "region",
    Usage: "Deployment region",
    Value: "par",  // Default value
}
```

### Advanced Validation

```go
&cli.IntFlag{
    Name:     "port",
    Usage:    "Port number",
    Required: true,
    Action: func(ctx context.Context, cmd *cli.Command, value int) error {
        if value < 1 || value > 65535 {
            return fmt.Errorf("port must be between 1 and 65535, got %d", value)
        }
        return nil
    },
}
```

## 5. Aliases Handling

### Command Aliases

```go
&cli.Command{
    Name:    "create",
    Aliases: []string{"c", "new"},  // Multiple aliases supported
    Usage:   "Create an application",
}
```

### Flag Aliases

```go
&cli.StringFlag{
    Name:    "type",
    Aliases: []string{"t", "kind"},  // Multiple aliases
    Usage:   "Application type",
}
```

### Alias Characteristics

- **Case sensitivity**: Aliases are case-sensitive
- **Length restrictions**: No explicit length restrictions
- **Prefix matching**: Supports prefix matching for commands
- **Conflict resolution**: First match wins in case of conflicts

## 6. Format/Parser Handling

### Built-in Parsers

urfave/cli includes built-in parsers for:

- Basic types (string, int, bool, float)
- Time and duration parsing
- Slice parsing (comma-separated or repeated flags)

### Custom Parsing

```go
&cli.TimestampFlag{
    Name: "deadline",
    Config: cli.TimestampConfig{
        Layouts: []string{"2006-01-02T15:04:05", "2006-01-02"},
    },
}
```

### Value Sources

Supports multiple value sources with precedence:
1. Command line flags
2. Environment variables
3. Configuration files
4. Default values

## 7. Benefits and Limitations

### Benefits

1. **Simplicity**: Declarative approach with minimal boilerplate
2. **No external dependencies**: Uses only Go standard library
3. **Comprehensive flag support**: Wide variety of flag types
4. **Automatic help generation**: Built-in help system
5. **Shell completion**: Support for bash, zsh, fish, powershell
6. **Flexible validation**: Per-flag validation with custom logic
7. **Nested commands**: Unlimited command nesting
8. **Alias support**: Multiple aliases for commands and flags
9. **Context integration**: Proper context.Context usage in v3

### Limitations

1. **Go-specific**: Only available for Go applications
2. **Flag inheritance**: Limited flag inheritance in nested commands
3. **Complex validation**: Requires custom code for complex validation scenarios
4. **Documentation generation**: Limited built-in documentation formats
5. **Argument validation**: Less sophisticated positional argument validation
6. **Configuration complexity**: Advanced configurations can become verbose

## 8. Conceptual Example: clever-tools create Command

Based on the current create command specifications, here's how it would look using urfave/cli:

```go
package main

import (
    "context"
    "fmt"
    "os"
    "github.com/urfave/cli/v3"
)

func main() {
    app := &cli.Command{
        Name:    "clever-tools",
        Usage:   "CLI tools for Clever Cloud",
        Version: "3.0.0",
        
        // Global flags
        Flags: []cli.Flag{
            &cli.BoolFlag{
                Name:    "color",
                Usage:   "Enable colored output",
                Value:   true,
            },
            &cli.BoolFlag{
                Name:    "verbose",
                Aliases: []string{"v"},
                Usage:   "Enable verbose output",
            },
            &cli.StringFlag{
                Name:    "org",
                Aliases: []string{"o"},
                Usage:   "Organization name",
            },
            &cli.StringFlag{
                Name:    "alias",
                Aliases: []string{"a"},
                Usage:   "Application alias",
            },
            &cli.StringFlag{
                Name:    "format",
                Aliases: []string{"f"},
                Usage:   "Output format",
                Value:   "human",
            },
        },
        
        Commands: []*cli.Command{
            {
                Name:    "create",
                Aliases: []string{"c"},
                Usage:   "Create an application",
                Description: "Create a new application on Clever Cloud with specified parameters. " +
                           "The application name is optional and can be provided as a positional argument.",
                
                Flags: []cli.Flag{
                    &cli.StringFlag{
                        Name:     "type",
                        Aliases:  []string{"t"},
                        Usage:    "Application type (e.g., node, php, java, python, go, ruby, rust, haskell)",
                        Required: true,
                        Action: func(ctx context.Context, cmd *cli.Command, value string) error {
                            validTypes := []string{"node", "php", "java", "python", "go", "ruby", "rust", "haskell", "static", "docker"}
                            for _, validType := range validTypes {
                                if value == validType {
                                    return nil
                                }
                            }
                            return fmt.Errorf("invalid application type: %s. Valid types: %v", value, validTypes)
                        },
                    },
                    &cli.StringFlag{
                        Name:    "region",
                        Aliases: []string{"r"},
                        Usage:   "Deployment region",
                        Value:   "par",
                        Action: func(ctx context.Context, cmd *cli.Command, value string) error {
                            validRegions := []string{"par", "mtl", "sgp", "syd", "wsw"}
                            for _, region := range validRegions {
                                if value == region {
                                    return nil
                                }
                            }
                            return fmt.Errorf("invalid region: %s. Valid regions: %v", value, validRegions)
                        },
                    },
                    &cli.BoolFlag{
                        Name:  "github",
                        Usage: "Link application to GitHub repository",
                    },
                    &cli.StringFlag{
                        Name:    "task",
                        Aliases: []string{"T"},
                        Usage:   "Task runner configuration",
                    },
                },
                
                Action: func(ctx context.Context, cmd *cli.Command) error {
                    // Extract flag values
                    appType := cmd.String("type")
                    region := cmd.String("region")
                    enableGithub := cmd.Bool("github")
                    task := cmd.String("task")
                    
                    // Extract global flags
                    verbose := cmd.Bool("verbose")
                    org := cmd.String("org")
                    alias := cmd.String("alias")
                    format := cmd.String("format")
                    colorEnabled := cmd.Bool("color")
                    
                    // Get optional positional argument (app-name)
                    var appName string
                    if cmd.NArg() > 0 {
                        appName = cmd.Args().Get(0)
                    }
                    
                    if verbose {
                        fmt.Printf("Creating application with:\n")
                        fmt.Printf("  Name: %s\n", appName)
                        fmt.Printf("  Type: %s\n", appType)
                        fmt.Printf("  Region: %s\n", region)
                        fmt.Printf("  GitHub: %v\n", enableGithub)
                        if task != "" {
                            fmt.Printf("  Task: %s\n", task)
                        }
                        if org != "" {
                            fmt.Printf("  Organization: %s\n", org)
                        }
                        if alias != "" {
                            fmt.Printf("  Alias: %s\n", alias)
                        }
                        fmt.Printf("  Format: %s\n", format)
                        fmt.Printf("  Color: %v\n", colorEnabled)
                    }
                    
                    // Implement application creation logic here
                    fmt.Printf("Creating %s application", appType)
                    if appName != "" {
                        fmt.Printf(" named '%s'", appName)
                    }
                    fmt.Printf(" in region %s...\n", region)
                    
                    return nil
                },
            },
        },
        
        Action: func(ctx context.Context, cmd *cli.Command) error {
            // Default action when no subcommand is provided
            return cli.ShowAppHelp(cmd)
        },
    }
    
    if err := app.Run(context.Background(), os.Args); err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
}
```

### Usage Examples

```bash
# Create a Node.js application with default region
clever-tools create --type node my-app

# Create with short flags and different region
clever-tools create -t python -r mtl my-python-app

# Create with GitHub integration and task runner
clever-tools create --type node --github --task "npm start" web-app

# Create with global options
clever-tools --verbose --org myorg create --type go --region sgp

# Show help for create command
clever-tools create --help

# Required flag validation (will show error)
clever-tools create my-app  # Error: Required flag "type" not set
```

## Conclusion

urfave/cli provides a robust, well-designed framework for building CLI applications in Go. Its declarative approach, comprehensive flag support, and automatic help generation make it an excellent choice for Go-based CLI tools. The framework's simplicity and flexibility would work well for implementing the clever-tools create command, providing clear structure for flags, validation, and help generation.

The main considerations for adoption would be:
1. **Language constraint**: Only available for Go applications
2. **Migration effort**: Would require rewriting existing JavaScript/Node.js code
3. **Feature parity**: Need to ensure all current clever-tools features can be replicated
4. **Team expertise**: Requires Go knowledge for maintenance and development

Overall, urfave/cli represents a mature, well-maintained solution for CLI development in the Go ecosystem.