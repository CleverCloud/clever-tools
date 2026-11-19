# 📖 `clever members` command reference

## ➡️ `clever members` <kbd>Since 5.5.0</kbd>

Manage the members of an organisation

```bash
clever members
```

## ➡️ `clever members invite` <kbd>Since 5.5.0</kbd>

Invite someone to an organisation

```bash
clever members invite --role <role> <org-id|org-name> <email> [options]
```

### 📥 Arguments

|Name|Description|
|---|---|
|`org-id\|org-name`|Organisation ID (or exact name, if unambiguous)|
|`email`|Email address of the person to invite|

### ⚙️ Options

|Name|Description|
|---|---|
|`--role` `<role>`|Role of the new member (admin, manager, developer, accounting) **(required)**|

### Examples

Invite someone, giving the role (admin, manager, developer or accounting):

```bash
clever members invite orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --role developer
clever members invite orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --role manager
```

### Notes

* The invitation is sent by email. Inviting the same address again replaces the previous invitation.
* The API limits invitations to 4 per hour per recipient and 11 per hour per sender.

## ➡️ `clever members list` <kbd>Since 5.5.0</kbd>

List the members of an organisation

```bash
clever members list <org-id|org-name> [options]
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
|`--without-2fa`|Only list the members without 2FA|

### Examples

List the members without two-factor authentication, or only the admins:

```bash
clever members list orga_00000000-0000-4000-8000-000000000200 --without-2fa
clever members list orga_00000000-0000-4000-8000-000000000200 --role admin
```

Get the emails of the members without two-factor authentication, to use them in a script:

```bash
clever members list orga_00000000-0000-4000-8000-000000000200 --without-2fa -F json | jq -r '.[].email'
```

## ➡️ `clever members remove` <kbd>Since 5.5.0</kbd>

Remove a member from an organisation

```bash
clever members remove <org-id|org-name> <member-id|email> [options]
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
clever members remove orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --yes
clever members remove orga_00000000-0000-4000-8000-000000000200 user_00000000-0000-4000-8000-000000000101 --yes
```

Leave an organisation, by removing yourself:

```bash
clever members remove orga_00000000-0000-4000-8000-000000000200 marie.dubois@example.com
```

### Notes

* The API refuses to remove the last admin of an organisation.
* When your role does not allow listing the members, give the member by ID (`user_...`): an email cannot be resolved.

## ➡️ `clever members update` <kbd>Since 5.5.0</kbd>

Update the role of a member of an organisation

```bash
clever members update --role <role> <org-id|org-name> <member-id|email> [options]
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
clever members update orga_00000000-0000-4000-8000-000000000200 giulia.rossi@example.com --role manager
clever members update orga_00000000-0000-4000-8000-000000000200 user_00000000-0000-4000-8000-000000000101 --role developer
```

### Notes

* Which roles you can assign depends on your own role: an admin can assign any role, a manager only `manager` and `developer`.
* The API refuses to demote the last admin of an organisation.
