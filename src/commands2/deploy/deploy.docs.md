# 📖 `clever deploy` command reference

## ➡️ `clever deploy`

Deploy an application

```bash
clever deploy [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-b`, `--branch` `<branch>` | Branch to push (current branch by default) |
| `-t`, `--tag` `<tag>` | Tag to push (none by default) |
| `-f`, `--force` | Force deploy even if it's not fast-forwardable |
| `-p`, `--same-commit-policy` `<policy>` | What to do when local and remote commit are identical (${...}) (default: `error`) |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `-q`, `--quiet` | Don't show logs during deployment |
| `--follow` | Continue to follow logs after deployment has ended |
| `-e`, `--exit-on` `<step>` | Step at which the logs streaming is ended, steps are: ${...} (default: `deploy-end`) |
