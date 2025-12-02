# 📖 `clever restart` command reference

## ➡️ `clever restart`

Start or restart an application

```bash
clever restart [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--commit` `<commit id>` | Restart the application with a specific commit ID |
| `--without-cache` | Restart the application without using cache |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
| `-q`, `--quiet` | Don't show logs during deployment |
| `--follow` | Continue to follow logs after deployment has ended |
| `-e`, `--exit-on` `<step>` | Step at which the logs streaming is ended, steps are: ${...} (default: `deploy-end`) |
