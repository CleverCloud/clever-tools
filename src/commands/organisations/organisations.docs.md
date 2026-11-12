# 📖 `clever organisations` command reference

## ➡️ `clever organisations` <kbd>Unreleased</kbd>

Manage organisations

```bash
clever organisations
```

## ➡️ `clever organisations get` <kbd>Unreleased</kbd>

Get the details of an organisation

```bash
clever organisations get <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever organisations list` <kbd>Unreleased</kbd>

List the organisations you are a member of, your personal space included

```bash
clever organisations list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

## ➡️ `clever organisations members` <kbd>Unreleased</kbd>

Manage the members of an organisation

```bash
clever organisations members
```

## ➡️ `clever organisations members invite` <kbd>Unreleased</kbd>

Invite someone to join an organisation, by email

```bash
clever organisations members invite <org-id|org-name> <email> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|
|`email`|Email address of the person to invite|

### ⚙️ Options

|Name|Description|
|---|---|
|`--role` `<role>`|Role of the new member (admin, manager, developer, accounting) (default: developer)|

## ➡️ `clever organisations members list` <kbd>Unreleased</kbd>

List the members of an organisation

```bash
clever organisations members list <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|
|`--role` `<role>`|Only list the members with this role (admin, manager, developer, accounting)|
|`--without-2fa`|Only list the members without two-factor authentication enabled|

## ➡️ `clever organisations members remove` <kbd>Unreleased</kbd>

Remove a member from an organisation, or leave it when the member is yourself

```bash
clever organisations members remove <org-id|org-name> <member-id|email> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|
|`member-id\|email`|Member ID (user_...) or email address|

### ⚙️ Options

|Name|Description|
|---|---|
|`-y`, `--yes`|Skip confirmation prompts|

## ➡️ `clever organisations members update` <kbd>Unreleased</kbd>

Update the role of a member of an organisation

```bash
clever organisations members update --role <role> <org-id|org-name> <member-id|email> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|
|`member-id\|email`|Member ID (user_...) or email address|

### ⚙️ Options

|Name|Description|
|---|---|
|`--role` `<role>`|New role of the member (admin, manager, developer, accounting) **(required)**|

## ➡️ `clever organisations update` <kbd>Unreleased</kbd>

Update the details of an organisation

```bash
clever organisations update <org-id|org-name> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|

### ⚙️ Options

|Name|Description|
|---|---|
|`--address` `<address>`|Billing address. An empty value clears it|
|`--billing-email` `<billing-email>`|Email address receiving the invoices. An empty value clears it|
|`--billing-name` `<billing-name>`|Full name of the billing contact. An empty value clears it|
|`--city` `<city>`|Billing city. An empty value clears it|
|`--company` `<company>`|Company name, for a business. An empty value clears it|
|`--country` `<country-code>`|Billing country, as a two-letter ISO code (for example FR). Required when the organisation already has a country. An empty value clears it|
|`--description` `<description>`|Description of the organisation|
|`--name` `<name>`|Name of the organisation|
|`--vat-number` `<vat-number>`|VAT number of the company, requires a company. An empty value clears it|
|`--zipcode` `<zipcode>`|Billing zipcode. An empty value clears it|
