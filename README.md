# Clever Tools

Hello Geo

[![npm version](https://img.shields.io/npm/v/clever-tools.svg)](https://www.npmjs.com/package/clever-tools)
[![Node.js requirement](https://img.shields.io/node/v/clever-tools.svg)](https://nodejs.org)

The official CLI for [Clever Cloud](https://www.clever.cloud) - Deploy and manage your applications, add-ons, and services from the command line with modern tooling and automated workflows. The perfect developer companion, complementing the [Clever Cloud Console](https://console.clever-cloud.com).

## Quick Start

**Prerequisites:** Node.js 22+ 

```bash
# Install globally
npm install -g clever-tools

# Or use directly without installation
npx --yes clever-tools@latest version
```

**First steps:**

```bash
clever login
clever profile
```

## Key Features

- **Complete Platform Control**: Manage applications, add-ons, domains, and services from the command line
- **Real-time Monitoring**: Stream logs, monitor deployments, and check application status
- **Seamless Deployment**: Deploy directly from your local environment or CI/CD pipelines
- **Cross-platform**: Available for Linux, macOS, Windows via multiple package managers
- **API Integration**: Direct access to Clever Cloud's API with authenticated commands

## Installation Options

For Node.js users, npm is the fastest way. For other installation methods including:

- Docker images
- Binary downloads
- Native packages (RPM, DEB)  
- Package managers (Homebrew, Winget, AUR)

See our complete [setup guide](docs/setup-systems.md).

### Autocompletion

Enable smart autocompletion for bash or zsh:

```bash
# Bash
clever --bash-autocomplete-script $(which clever) | sudo tee /usr/share/bash-completion/completions/clever

# Zsh  
clever --zsh-autocomplete-script $(which clever) | sudo tee /usr/share/zsh/site-functions/_clever
```

## Documentation

- **[Complete CLI Documentation](https://www.clever-cloud.com/developers/doc/cli/)** - Official user guide
- **[CLI Reference](https://www.clever-cloud.com/developers/doc/reference/cli/)** - Complete command reference
- **[Deployment Examples](https://www.clever-cloud.com/developers/guides/)** - Real-world tutorials

## Basic Usage

### Authentication

```bash
# Interactive login
clever login

# Non-interactive login
clever login --token <your-token> --secret <your-secret>

# Or use environment variables, idéal for CI/CD
export CLEVER_TOKEN="your-token"
export CLEVER_SECRET="your-secret"
clever profile
```

### Application Management

```bash
# List applications
clever applications list

# Create a new Node.js/Bun application
clever applications create --type node

# Link existing app to the current directory
clever link <app_id>

# Deploy current directory
clever deploy

# Monitor logs
clever logs --since 1h

# Restart an application
clever restart --app <app_id>
```

Learn more in our [Application Management Guide](https://www.clever-cloud.com/developers/doc/cli/applications/).

### Add-ons & Services Management

```bash
# List add-ons
clever addon

# Create a PostgreSQL add-on
clever addon create postgresql-addon myPG

# Create a Cellar (S3-compatible storage) add-on
clever addon create cellar-addon  myCellar

# Create and manage a Keycloak service
clever addon create keycloak myKeycloak

clever features enable operatos
clever keycloak get myKetcloak
```

Learn more in our [Add-ons & Services Guide](https://www.clever-cloud.com/developers/doc/cli/addons/).

# Create and manage

### API Access with clever curl and clever tokens

Access Clever Cloud's API directly through authenticated commands:

```bash
# Get your user information
clever curl https://api.clever-cloud.com/v2/self

# Get platform summary
clever curl https://api.clever-cloud.com/v2/summary

# List your applications (with jq for filtering)
clever curl https://api.clever.cloud/v2/organisations/<ORG_ID>/applications | jq '.[].id'

# Create API tokens for external tools
clever tokens create myTokenName
clever tokens create myTokenName --expiration 2w --format json
```

Learn more about API integration in our [API How-to Guide](https://www.clever-cloud.com/developers/api/howto).

### Get Help

```bash
clever help                    # List all commands
clever <command> --help        # Get specific help
clever --format json <command> # JSON output for scripting
```

## Support & Contributing

- **Issues & Questions**: [GitHub Issues](https://github.com/CleverCloud/clever-tools/issues)
- **Email Support**: [Ticket Center](https://console.clever-cloud.com/ticket-center-choice)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines

## License

This project is licensed under the [Apache-2.0](LICENSE).
