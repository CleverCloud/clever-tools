# 📖 `clever create` command reference

## ➡️ `clever create` <kbd>Since 0.2.0</kbd>

Create an application

```bash
clever create --type <instance-type> [app-name] [options]
```

### 📥 Arguments

| Name | Description |
|------|-------------|
| `app-name` | Application name (optional, current directory name is used if not specified) *(optional)* |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-t`, `--type` `<instance-type>` | Instance type **(required)** |
| `-r`, `--region` `<zone>` | Region, can be ${...} (default: `par`) |
| `--github` `<owner/repo>` | GitHub application to use for deployments |
| `-T`, `--task` `<command>` | The application launch as a task executing the given command, then stopped |
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
