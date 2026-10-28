# 📖 `clever terraform` command reference

> [!NOTE]
> 🧪 **Experimental**: This command may change or be removed in future versions.
> Enable with: `clever features enable terraform`

## ➡️ `clever terraform` <kbd>Since 5.3.0</kbd>

Terraform commands

```bash
clever terraform
```

## ➡️ `clever terraform generate` <kbd>Since 5.3.0</kbd>

Generate terraform import file

```bash
clever terraform generate [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--app` `<app-id\|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-o`, `--org`, `--owner` `<org-id\|org-name>`|Organisation to target by its ID (or name, if unambiguous)|
|`-t`, `--tag` `<tag>`|Filter resources by tag|
