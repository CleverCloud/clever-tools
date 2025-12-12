# 📖 `clever tcp-redirs` command reference

## ➡️ `clever tcp-redirs` <kbd>Since 2.3.0</kbd>

Control the TCP redirections from reverse proxies to your application

```bash
clever tcp-redirs [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever tcp-redirs add` <kbd>Since 2.3.0</kbd>

Add a new TCP redirection to the application

```bash
clever tcp-redirs add --namespace <namespace> [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`--namespace`, `<namespace>`|Namespace in which the TCP redirection should be **(required)**|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|

## ➡️ `clever tcp-redirs list-namespaces` <kbd>Since 2.3.0</kbd>

List the namespaces in which you can create new TCP redirections

```bash
clever tcp-redirs list-namespaces [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
|`-F`, `--format`, `<format>`|Output format (${...}) (default: `human`)|

## ➡️ `clever tcp-redirs remove` <kbd>Since 2.3.0</kbd>

Remove a TCP redirection from the application

```bash
clever tcp-redirs remove --namespace <namespace> <port> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`port`|port identifying the TCP redirection|

### ⚙️ Options

|Name|Description|
|---|---|
|`--namespace`, `<namespace>`|Namespace in which the TCP redirection should be **(required)**|
|`-a`, `--alias`, `<alias>`|Short name for the application|
|`--app`, `<app-id|app-name>`|Application to manage by its ID (or name, if unambiguous)|
