# 📖 `clever kv` command reference

## ➡️ `clever kv` <kbd>Since 3.11.0</kbd>

Send a raw command to a Materia KV or Redis® add-on

```bash
clever kv <kv-id> <command> [options]
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### 📥 Arguments

| Name | Description |
|------|-------------|
| `kv-id` | Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on |
| `command` | The raw command to send to the Materia KV or Redis® add-on |

### ⚙️ Options

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<org-id\|org-name>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
