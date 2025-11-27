# 📖 `clever kv` command reference

## ➡️ `clever kv`

Send a raw command to a Materia KV or Redis® add-on

```bash
clever kv [FLAGS] <KV-ID> <COMMAND>
```

> 🧪 **Experimental**: This command may change or be removed in future versions.

### ⚙️ Arguments

| Name | Description |
|------|-------------|
| `kv-id` | Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on **(required)** |
| `command` | The raw command to send to the Materia KV or Redis® add-on **(required)** |

### 🚩 Flags

| Name | Description |
|------|-------------|
| `-o`, `-owner`, `--org` `<ID_OR_NAME>` | Organisation to target by its ID (or name, if unambiguous) |
| `-F`, `--format` `<format>` | Output format (${...}) (default: `human`) |
