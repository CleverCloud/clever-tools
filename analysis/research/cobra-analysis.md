# Cobra Framework Analysis

## Overview

Cobra is a Go library that provides a simple interface for creating powerful modern CLI applications. It's designed around the pattern `APPNAME VERB NOUN --ADJECTIVE` where commands represent actions, arguments are things, and flags are modifiers.

## 1. Command Structure and Description Patterns

### Command Definition
Commands in Cobra are defined using the `cobra.Command` struct with several key fields:

```go
var rootCmd = &cobra.Command{
    Use:   "app [command]",
    Short: "A brief description of your application",
    Long: `A longer description that spans multiple lines and likely contains
examples and usage of using your command.`,
    Example: "app create myapp --type static",
    Run: func(cmd *cobra.Command, args []string) {
        // Command logic here
    },
}
```

### Key Command Fields
- **Use**: Defines the command usage pattern
- **Short**: Brief one-line description
- **Long**: Extended description with details
- **Example**: Usage examples
- **Aliases**: Alternative names for the command
- **Args**: Argument validation function
- **Run/RunE**: Command execution function

### Command Hierarchy
Cobra supports nested subcommands with infinite depth:

```go
// Root command
var rootCmd = &cobra.Command{Use: "app"}

// Subcommand
var createCmd = &cobra.Command{
    Use:   "create [name]",
    Short: "Create a new application",
    Args:  cobra.MaximumNArgs(1),
}

// Add subcommand to root
rootCmd.AddCommand(createCmd)
```

## 2. Options/Flags Description and Naming Conventions

### Flag Types and Definition Patterns

Cobra supports various flag types with consistent naming conventions:

```go
// String flags
cmd.Flags().StringVarP(&variable, "long-name", "s", "default", "Description")

// Boolean flags
cmd.Flags().BoolVarP(&variable, "verbose", "v", false, "Enable verbose output")

// Integer flags
cmd.Flags().IntVarP(&variable, "port", "p", 8080, "Port number")

// Duration, IP, and other types are supported
```

### Naming Conventions
- **Long flags**: Use kebab-case (e.g., `--config-file`, `--dry-run`)
- **Short flags**: Single character (e.g., `-v`, `-p`, `-h`)
- **Boolean flags**: Use positive verbs (e.g., `--verbose`, `--force`)
- **Descriptions**: Start with capital letter, no period at end

### Flag Scopes

#### Persistent Flags (Inherited by subcommands)
```go
rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")
```

#### Local Flags (Command-specific)
```go
createCmd.Flags().StringVarP(&appType, "type", "t", "", "Application type")
```

## 3. Positional Arguments Description and Naming

### Built-in Argument Validators
Cobra provides several built-in argument validation functions:

```go
// No arguments allowed
Args: cobra.NoArgs

// Exact number of arguments
Args: cobra.ExactArgs(1)

// Minimum number of arguments
Args: cobra.MinimumNArgs(1)

// Maximum number of arguments
Args: cobra.MaximumNArgs(2)

// Range of arguments
Args: cobra.RangeArgs(1, 3)

// Only predefined valid arguments
Args: cobra.OnlyValidArgs
ValidArgs: []string{"static", "nodejs", "php"},
```

### Custom Argument Validation
```go
Args: func(cmd *cobra.Command, args []string) error {
    if len(args) < 1 {
        return errors.New("requires at least one argument")
    }
    if !isValidAppName(args[0]) {
        return fmt.Errorf("invalid app name: %s", args[0])
    }
    return nil
},
```

### Argument Naming Conventions
- Use descriptive names in the `Use` field: `create [app-name]`
- Use square brackets for optional args: `[app-name]`
- Use angle brackets for required args: `<app-name>`
- Use ellipsis for multiple args: `[files...]`

## 4. Required/Default Values Handling

### Required Flags
```go
// Mark flag as required
cmd.Flags().StringVarP(&appType, "type", "t", "", "Application type (required)")
cmd.MarkFlagRequired("type")

// Group requirements
cmd.MarkFlagsRequiredTogether("username", "password")
cmd.MarkFlagsMutuallyExclusive("config", "config-dir")
```

### Default Values
```go
// Set default in flag definition
cmd.Flags().StringVarP(&region, "region", "r", "par", "Deployment region")

// Conditional defaults
var region string
cmd.Flags().StringVarP(&region, "region", "r", "", "Deployment region")
cmd.PreRun = func(cmd *cobra.Command, args []string) {
    if region == "" {
        region = getDefaultRegion()
    }
}
```

### Environment Variable Integration
```go
// With Viper integration
viper.BindPFlag("region", cmd.Flags().Lookup("region"))
viper.SetDefault("region", "par")
```

## 5. Aliases Handling

### Command Aliases
```go
var createCmd = &cobra.Command{
    Use:     "create [app-name]",
    Aliases: []string{"new", "add", "c"},
    Short:   "Create a new application",
}
```

### Flag Aliases
Flag aliases are handled through the short flag mechanism:
```go
// Long flag: --type, Short alias: -t
cmd.Flags().StringVarP(&appType, "type", "t", "", "Application type")
```

### Case Sensitivity
- Command names and aliases are **case-sensitive**
- Flag names are **case-sensitive**
- Arguments are typically **case-sensitive** (handled by application logic)

### Length Restrictions
- Short flags: Exactly 1 character
- Long flags: No enforced limit, but convention suggests reasonable length
- Command aliases: No enforced limit

## 6. Formats/Parsers Handling

### Built-in Type Parsing
Cobra automatically handles common types:
```go
// Automatically parsed types
cmd.Flags().IntVar(&port, "port", 8080, "Port number")
cmd.Flags().DurationVar(&timeout, "timeout", 30*time.Second, "Timeout")
cmd.Flags().IPVar(&ip, "bind", net.ParseIP("127.0.0.1"), "IP to bind")
```

### Custom Parsers
```go
// Custom flag type
type AppType string
const (
    Static AppType = "static"
    NodeJS AppType = "nodejs"
    PHP    AppType = "php"
)

func (a *AppType) String() string { return string(*a) }
func (a *AppType) Set(v string) error {
    switch v {
    case "static", "nodejs", "php":
        *a = AppType(v)
        return nil
    default:
        return errors.New(`must be one of "static", "nodejs", or "php"`)
    }
}
func (a *AppType) Type() string { return "apptype" }

// Usage
var appType AppType
cmd.Flags().Var(&appType, "type", "Application type")
```

### Output Format Handling
```go
// Common pattern for output formats
var outputFormat string
cmd.Flags().StringVarP(&outputFormat, "output", "o", "table", 
    "Output format (table|json|yaml)")

// Validation in PreRun
cmd.PreRunE = func(cmd *cobra.Command, args []string) error {
    validFormats := []string{"table", "json", "yaml"}
    for _, format := range validFormats {
        if outputFormat == format {
            return nil
        }
    }
    return fmt.Errorf("invalid output format: %s", outputFormat)
}
```

## 7. Benefits

### Developer Experience
- **Rapid Development**: Minimal boilerplate code for CLI creation
- **Auto-generated Help**: Comprehensive help text generation
- **Shell Completion**: Built-in support for Bash, Zsh, Fish, PowerShell
- **Type Safety**: Strong typing for flags and arguments

### Feature Richness
- **POSIX Compliance**: Full POSIX-compliant flag parsing
- **Nested Commands**: Unlimited command hierarchy depth
- **Flag Inheritance**: Persistent flags cascade to subcommands
- **Validation**: Built-in and custom validation support

### Enterprise Features
- **Configuration Integration**: Seamless Viper integration
- **Error Handling**: Sophisticated error reporting and suggestions
- **Extensibility**: Plugin-like architecture for command registration
- **Testing Support**: Easy unit testing of commands

### Real-world Adoption
- Used by major projects: Kubernetes (kubectl), GitHub CLI, Helm, Hugo
- Proven scalability in complex CLI applications
- Active community and maintenance

## 8. Limitations

### Go-Specific
- **Language Lock-in**: Only available for Go projects
- **Binary Size**: Go binaries can be large compared to scripts
- **Compilation Required**: No interpreted execution

### Learning Curve
- **Go Knowledge Required**: Need to understand Go idioms and patterns
- **Complex Configuration**: Advanced features require understanding of Go structs
- **Debugging**: Compiled nature makes debugging more complex than scripts

### Framework Overhead
- **Dependency Weight**: Adds significant dependencies to project
- **Opinionated Structure**: Enforces specific architectural patterns
- **Performance**: Some overhead compared to minimal CLI implementations

### Limited Flexibility
- **Flag Parsing**: Locked into pflag library behavior
- **Command Structure**: Must follow Cobra's hierarchical model
- **Customization Limits**: Some UI customization is difficult

## 9. Clever-Tools Create Command Example

Based on the current clever-tools create command specification, here's how it would be structured using Cobra:

```go
package cmd

import (
    "fmt"
    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

// Global variables for flags
var (
    // Global flags
    verbose   bool
    color     string
    org       string
    alias     string
    format    string
    
    // Create command specific flags
    appType   string
    region    string
    github    string
    task      string
)

// Root command
var rootCmd = &cobra.Command{
    Use:   "clever",
    Short: "Clever Cloud CLI tool",
    Long: `clever-tools is a CLI for managing applications and services on Clever Cloud.
It provides commands for creating, deploying, and managing your applications.`,
}

// Create command
var createCmd = &cobra.Command{
    Use:   "create [app-name]",
    Short: "Create an application",
    Long: `Create a new application on Clever Cloud.

The application will be created with the specified type and configuration.
If no app-name is provided, a name will be generated automatically.`,
    Example: `  # Create a Node.js application
  clever create myapp --type nodejs --region par

  # Create with GitHub integration
  clever create --type static --github user/repo

  # Create with custom task runner
  clever create myapp -t php -T "npm run build"`,
    Args: cobra.MaximumNArgs(1),
    PreRunE: func(cmd *cobra.Command, args []string) error {
        // Validate required flags
        if appType == "" {
            return fmt.Errorf("application type is required (use --type or -t)")
        }
        
        // Validate app type
        validTypes := []string{"static", "nodejs", "php", "python", "java", "go", "rust"}
        for _, valid := range validTypes {
            if appType == valid {
                goto typeValid
            }
        }
        return fmt.Errorf("invalid application type: %s (must be one of: %v)", 
            appType, validTypes)
        
    typeValid:
        // Validate output format
        validFormats := []string{"json", "table", "yaml"}
        for _, valid := range validFormats {
            if format == valid {
                return nil
            }
        }
        return fmt.Errorf("invalid output format: %s (must be one of: %v)", 
            format, validFormats)
    },
    RunE: func(cmd *cobra.Command, args []string) error {
        // Extract app name from args or generate
        var appName string
        if len(args) > 0 {
            appName = args[0]
        } else {
            appName = generateAppName()
        }
        
        // Create application
        app, err := createApplication(CreateRequest{
            Name:   appName,
            Type:   appType,
            Region: region,
            GitHub: github,
            Task:   task,
            Org:    org,
        })
        if err != nil {
            return fmt.Errorf("failed to create application: %w", err)
        }
        
        // Output result based on format
        return outputResult(app, format)
    },
}

func init() {
    // Add create command to root
    rootCmd.AddCommand(createCmd)
    
    // Global persistent flags
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, 
        "Enable verbose output")
    rootCmd.PersistentFlags().StringVar(&color, "color", "auto", 
        "Colorize output (auto|never|always)")
    rootCmd.PersistentFlags().StringVar(&org, "org", "", 
        "Organization ID or name")
    rootCmd.PersistentFlags().StringVar(&alias, "alias", "", 
        "Application alias")
    rootCmd.PersistentFlags().StringVarP(&format, "format", "f", "table", 
        "Output format (table|json|yaml)")
    
    // Create command flags
    createCmd.Flags().StringVarP(&appType, "type", "t", "", 
        "Application type (required)")
    createCmd.Flags().StringVarP(&region, "region", "r", "par", 
        "Deployment region")
    createCmd.Flags().StringVar(&github, "github", "", 
        "GitHub repository (user/repo)")
    createCmd.Flags().StringVarP(&task, "task", "T", "", 
        "Task runner command")
    
    // Mark required flags
    createCmd.MarkFlagRequired("type")
    
    // Bind flags to viper for configuration file support
    viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
    viper.BindPFlag("color", rootCmd.PersistentFlags().Lookup("color"))
    viper.BindPFlag("org", rootCmd.PersistentFlags().Lookup("org"))
    viper.BindPFlag("region", createCmd.Flags().Lookup("region"))
}

// Helper types and functions
type CreateRequest struct {
    Name   string
    Type   string
    Region string
    GitHub string
    Task   string
    Org    string
}

func generateAppName() string {
    // Implementation for generating app name
    return "clever-app-" + randomString(8)
}

func createApplication(req CreateRequest) (*Application, error) {
    // Implementation for creating application
    return &Application{
        ID:     "app_12345",
        Name:   req.Name,
        Type:   req.Type,
        Region: req.Region,
        Status: "created",
    }, nil
}

func outputResult(app *Application, format string) error {
    switch format {
    case "json":
        return outputJSON(app)
    case "yaml":
        return outputYAML(app)
    default:
        return outputTable(app)
    }
}

// Main execution
func Execute() error {
    return rootCmd.Execute()
}
```

### Usage Examples

```bash
# Basic usage with required type flag
clever create myapp --type nodejs

# With short flags and aliases
clever create myapp -t nodejs -r par

# Global flags
clever create myapp --type static --verbose --format json

# Without app name (auto-generated)
clever create --type php --region rbx

# With GitHub integration
clever create myapp --type static --github myuser/myrepo

# With custom task runner
clever create myapp -t nodejs -T "npm run build"

# Help
clever create --help
clever create -h
```

### Command Structure Comparison

| Feature | Current CLI | Cobra Implementation |
|---------|-------------|---------------------|
| Command | `create` | `cobra.Command{Use: "create [app-name]"}` |
| Required flags | `--type` | `MarkFlagRequired("type")` |
| Flag aliases | `-t`, `-r`, `-T` | `StringVarP(..., "type", "t", ...)` |
| Default values | `region: 'par'` | `StringVarP(..., "region", "r", "par", ...)` |
| Optional args | `app-name` | `Args: cobra.MaximumNArgs(1)` |
| Global flags | `--verbose`, `--format` | `PersistentFlags()` |
| Validation | Custom | `PreRunE` function |
| Help generation | Manual | Automatic |

This Cobra implementation provides:
- Type-safe flag handling
- Automatic help generation
- Built-in validation
- Shell completion
- Configuration file integration via Viper
- Consistent error handling
- Extensible command structure for future subcommands