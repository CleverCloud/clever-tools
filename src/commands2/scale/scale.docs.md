# 📖 `clever scale` command reference

## ➡️ `clever scale` <kbd>Since 0.4.0</kbd>

Change scalability of an application

```bash
clever scale [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`--build-flavor`, `<buildflavor>`|The size of the build instance, or 'disabled' if you want to disable dedicated build instances|
|`--flavor`, `<flavor>`|The instance size of your application|
|`--instances`, `<instances>`|The number of parallel instances|
|`--max-flavor`, `<maxflavor>`|The maximum instance size of your application|
|`--max-instances`, `<maxinstances>`|The maximum number of parallel instances|
|`--min-flavor`, `<minflavor>`|The minimum scale size of your application|
|`--min-instances`, `<mininstances>`|The minimum number of parallel instances|
