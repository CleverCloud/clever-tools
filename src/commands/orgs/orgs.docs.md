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

### Examples

Get the details of an organisation, by ID or by its exact name:

```bash
clever orgs get orga_00000000-0000-4000-8000-000000000200
clever orgs get "Foo Inc"
```

Get the billing email of an organisation, to use it in a script:

```bash
clever orgs get orga_00000000-0000-4000-8000-000000000200 -F json | jq -r '.billingEmail'
```

### Notes

* `membersCount` and `adminsCount` are `null` for the personal space, and when your role does not allow listing the members (the human output prints `Members: -`).
* `country` is the name of the country (for example `FRANCE`) and `countryCode` its ISO code (for example `FR`).

## ➡️ `clever orgs list` <kbd>Unreleased</kbd>

List your organisations

```bash
clever orgs list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

### Examples

List the IDs of the organisations where you are an admin:

```bash
clever orgs list -F json | jq -r '.[] | select(.role == "ADMIN") | .id'
```

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

### Examples

Rename an organisation:

```bash
clever orgs update orga_00000000-0000-4000-8000-000000000200 --name "Foo Corp"
```

Set the company and its VAT number:

```bash
clever orgs update orga_00000000-0000-4000-8000-000000000200 --company "Foo SAS" --vat-number FR12345678901
```

Switch a company to an individual, by clearing both the company and the VAT number:

```bash
clever orgs update orga_00000000-0000-4000-8000-000000000200 --company "" --vat-number ""
```

### Notes

* Without any option, in a terminal, the command asks for each field: Enter keeps the current value, `-` clears it.
* Only the given options change, the other fields keep their current value.
* An empty value (`--address ""`) clears the field, except for `--name` and `--description`, which are required.
* `--vat-number` requires a company. The country is derived from the prefix of the VAT number: the output shows the country actually stored.
