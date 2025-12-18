# 📖 `clever kv` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable kv`

## ➡️ `clever kv` <kbd>Since 3.11.0</kbd>

Send a raw command to a Materia KV or Redis® add-on

```bash
clever kv <kv-id|addon-id|addon-name> <command> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`kv-id|addon-id|addon-name`|Add-on/Real ID (or name, if unambiguous) of a Materia KV or Redis® add-on|
|`command`|The raw command to send to the Materia KV or Redis® add-on|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
