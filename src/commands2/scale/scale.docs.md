# 📖 `clever scale` command reference

## ➡️ `clever scale`

Change scalability of an application

```bash
clever scale [FLAGS]
```

### 🚩 Flags

| Name | Description |
|------|-------------|
| `--flavor` `<flavor>` | The instance size of your application |
| `--min-flavor` `<minflavor>` | The minimum scale size of your application |
| `--max-flavor` `<maxflavor>` | The maximum instance size of your application |
| `--instances` `<instances>` | The number of parallel instances |
| `--min-instances` `<mininstances>` | The minimum number of parallel instances |
| `--max-instances` `<maxinstances>` | The maximum number of parallel instances |
| `--build-flavor` `<buildflavor>` | The size of the build instance, or 'disabled' if you want to disable dedicated build instances |
| `-a`, `--alias` `<alias>` | Short name for the application |
| `--app` `<ID_OR_NAME>` | Application to manage by its ID (or name, if unambiguous) |
