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

### Examples

Get the details of an organisation, by ID or by its exact name:

```bash
clever organisations get orga_00000000-0000-4000-8000-000000000200
clever organisations get "Foo Inc"
```

Get the billing email of an organisation, to use it in a script:

```bash
clever organisations get orga_00000000-0000-4000-8000-000000000200 -F json | jq -r '.billingEmail'
```

### Notes

* `membersCount` and `adminsCount` are `null` for the personal space, and when your role does not allow listing the members (the human output prints `Members: -`).
* `country` is the name returned by the API (for example `FRANCE`), not an ISO code.

## ➡️ `clever organisations list` <kbd>Unreleased</kbd>

List the organisations you are a member of, your personal space included

```bash
clever organisations list [options]
```

### ⚙️ Options

|Name|Description|
|---|---|
|`-F`, `--format` `<format>`|Output format (human, json) (default: human)|

### Examples

List the IDs of the organisations where you are an admin:

```bash
clever organisations list -F json | jq -r '.[] | select(.role == "ADMIN") | .id'
```

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

### Examples

Invite someone as a developer (the default role), or with another role:

```bash
clever organisations members invite orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com
clever organisations members invite orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --role manager
```

### Notes

* The invitation is sent by email. Inviting the same address again replaces the previous invitation.
* The API limits invitations to 4 per hour per recipient and 11 per hour per sender.

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

### Examples

List the members without two-factor authentication, or only the admins:

```bash
clever organisations members list orga_00000000-0000-4000-8000-000000000200 --without-2fa
clever organisations members list orga_00000000-0000-4000-8000-000000000200 --role admin
```

Get the emails of the members without two-factor authentication, to use them in a script:

```bash
clever organisations members list orga_00000000-0000-4000-8000-000000000200 --without-2fa -F json | jq -r '.[].email'
```

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

### Examples

Remove a member, by email or by ID, without the confirmation prompt:

```bash
clever organisations members remove orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --yes
clever organisations members remove orga_00000000-0000-4000-8000-000000000200 user_00000000-0000-4000-8000-000000000101 --yes
```

Leave an organisation, by removing yourself:

```bash
clever organisations members remove orga_00000000-0000-4000-8000-000000000200 marie.dubois@example.com
```

### Notes

* The API refuses to remove the last admin of an organisation.
* When your role does not allow listing the members, give the member by ID (`user_...`): an email cannot be resolved.

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

### Examples

Change the role of a member, by email or by ID:

```bash
clever organisations members update orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --role manager
clever organisations members update orga_00000000-0000-4000-8000-000000000200 user_00000000-0000-4000-8000-000000000101 --role developer
```

### Notes

* Which roles you can assign depends on your own role: an admin can assign any role, a manager only `manager` and `developer`.
* The API refuses to demote the last admin of an organisation.

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

### Examples

Rename an organisation that has a country (the country must be given again, see the notes):

```bash
clever organisations update orga_00000000-0000-4000-8000-000000000200 --name "Foo Corp" --country FR
```

Set the company and its VAT number:

```bash
clever organisations update orga_00000000-0000-4000-8000-000000000200 --company "Foo SAS" --vat-number FR12345678901 --country FR
```

Switch a company to an individual, by clearing both the company and the VAT number:

```bash
clever organisations update orga_00000000-0000-4000-8000-000000000200 --company "" --vat-number "" --country FR
```

### Notes

* Only the given options change, the other fields keep their current value.
* An empty value (`--address ""`) clears the field, except for `--name` and `--description`, which are required.
* The API returns the country as a name (for example `FRANCE`) but only accepts a two-letter ISO code (for example `FR`). When the organisation has a country, `--country` is therefore required, to keep or change it.
* `--vat-number` requires a company. The country is derived from the prefix of the VAT number: the output shows the country actually stored.
