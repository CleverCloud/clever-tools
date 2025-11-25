# 📖 `clever create` command reference

## ➡️ `clever create`

Create an application

```bash
clever create [OPTIONS] <APP-NAME> --type <TYPE>
```

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `app-name` | Application name (optional, current directory name is used if not specified) |

### 🚩 Options

| Name | Description |
|------|-------------|
| `-t`, `--type` `<type>` | Instance type |
| `-r`, `--region` `<zone>` | Region, can be ${...} |
| `--github` `<OWNER/REPO>` | GitHub application to use for deployments |
| `-T`, `--task` `<command>` | The application launch as a task executing the given command, then stopped |
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `-F`, `--format` `<format>` | Output format (${...}) |
