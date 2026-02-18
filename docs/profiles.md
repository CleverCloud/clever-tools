# Profiles and overrides

You can use multiple profiles with Clever Tools, all stored in the configuration file. The active profile is the first one in the list and is used for all commands. Each profile contains your authentication data and an optional set of overrides for custom Clever Cloud deployments (API host, Console URL, etc.).

> [!TIP]
> The configuration file lives in your OS config directory:
> - Windows: `%APPDATA%\clever-cloud\clever-tools.json`
> - Other systems: XDG config directory (typically `~/.config/clever-cloud/clever-tools.json`)

## Create and use multiple profiles

By default, `clever login` stores a profile under the `default` alias. To manage multiple accounts, log in with explicit aliases:

```bash
clever login --alias personal
clever login --alias work
```

List and inspect profiles (the active one is marked):

```bash
clever profile list
```

Switch to another profile:

```bash
clever profile switch --alias work
```

Log out from a specific profile:

```bash
clever logout --alias personal
```

## Overrides

Overrides are stored per profile and are applied only when that profile is active. You can set them at login time:

```bash
clever login --alias staging \
  --api-host https://api.clever-cloud.com \
  --console-url https://console.clever-cloud.com \
  --auth-bridge-host https://api-bridge.clever-cloud.com \
  --ssh-gateway ssh@sshgateway-clevercloud-customers.services.clever-cloud.com
```

Resolution order for configuration values:

1. Defaults provided by Clever Tools
2. Active profile overrides
3. Environment variables

To change overrides later, log in again with the same alias. The profile will be replaced and becomes active.

## Special cases

- If `CLEVER_TOKEN` and `CLEVER_SECRET` are set, Clever Tools injects a virtual `$env` profile that becomes active. You cannot switch or logout while `$env` is active; unset those environment variables first.
- The alias `$env` is reserved and cannot be used with `clever login --alias`.
- If there is only one stored profile, `clever profile switch` fails. With exactly two profiles and no `--alias`, it switches to the other one; with more than two, it prompts you to pick a profile.
- Logging in with an existing alias replaces the stored profile (including any previous overrides) and makes it active.
