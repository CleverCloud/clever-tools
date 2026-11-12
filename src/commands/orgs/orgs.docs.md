# 📖 `clever orgs` command reference

## ➡️ `clever orgs` <kbd>Unreleased</kbd>

Manage organisations

```bash
clever orgs
```

## ➡️ `clever orgs get` <kbd>Unreleased</kbd>

Get the details of an organisation

```bash
clever orgs get <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever orgs list` <kbd>Unreleased</kbd>

List your organisations

```bash
clever orgs list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever orgs update` <kbd>Unreleased</kbd>

Update the details of an organisation

```bash
clever orgs update <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`--address` `<address>`|Billing address|
|`--billing-email` `<billing-email>`|Email receiving the invoices|
|`--billing-name` `<billing-name>`|Billing contact name|
|`--city` `<city>`|Billing city|
|`--company` `<company>`|Company name|
|`--country` `<country-code>`|Billing country, as a two-letter ISO code (e.g.: FR)|
|`--description` `<description>`|Organisation description|
|`--name` `<name>`|Organisation name|
|`--vat-number` `<vat-number>`|VAT number, requires a company|
|`--zipcode` `<zipcode>`|Billing zipcode|
