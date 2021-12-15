# Network Groups CLI commands

This document is a list of all Network Group-related commands.

For each command, example call and output are commented right under.

To improve readability, and to avoid errors, every option value is written inside quotes.

> **Disclaimer:** This document isn't generated from code, and therefore might **not** be up-to-date.

## Table Of Contents

- [Table Of Contents](#table-of-contents)
- [`clever networkgroups` | `clever ng`](#clever-networkgroups--clever-ng)
  - [`list`](#list)
  - [`create`](#create)
  - [`delete`](#delete)
  - [`join`](#join)
  - [`leave`](#leave)
  - [`members`](#members)
    - [`members list`](#members-list)
    - [`members get`](#members-get)
    - [`members add`](#members-add)
    - [`members remove`](#members-remove)
  - [`peers`](#peers)
    - [`peers list`](#peers-list)
    - [`peers get`](#peers-get)
    - [`peers add-external`](#peers-add-external)
    - [`peers remove-external`](#peers-remove-external)

## `clever networkgroups` | `clever ng`

List Network Groups commands

### `list`

List Network Groups with their labels

| Param             | Description                                 |
| ----------------- | ------------------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false)             |
| `[--json, -j]`    | Show result in JSON format (default: false) |

---

### `create`

Create a Network Group

| Param                          | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `[--verbose, -v]`              | Verbose output (default: false)                |
| `--label NG_LABEL`             | Network Group label, also used for dns context |
| `--description NG_DESCRIPTION` | Network Group description                      |
| `[--tags] TAGS`                | List of tags separated by a comma              |
| `[--json, -j]`                 | Show result in JSON format (default: false)    |

---

### `delete`

Delete a Network Group

| Param             | Description                     |
| ----------------- | ------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false) |
| `--ng NG`         | Network Group ID or label       |

---

### `join`

Join a Network Group

| Param                                       | Description                                             |
| ------------------------------------------- | ------------------------------------------------------- |
| `[--verbose, -v]`                           | Verbose output (default: false)                         |
| `--ng NG`                                   | Network Group ID or label                               |
| `--label PEER_LABEL`                        | Network Group peer label                                |
| `--node-category-id, -c NODE_CATEGORY_ID`   | The external node category ID                           |
| `[--private-key PRIVATE_KEY]`               | A WireGuard® private key                                |
| `[--role] PEER_ROLE`                        | The peer role, ('client' or 'server') (default: client) |
| `[--ip] IP_ADDRESS`                         | An IP address                                           |
| `[--port] PORT_NUMBER`                      | A port number                                           |

---

### `leave`

Manually leave a Network Group if a problem occured

| Param                 | Description               |
| --------------------- | ------------------------- |
| `--ng NG`             | Network Group ID or label |
| `[--peer-id] PEER_ID` | The peer ID               |

---

### `members`

List commands for interacting with Network Groups members

#### `members list`

List members of a Network Group

| Param                  | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `[--verbose, -v]`      | Verbose output (default: false)                                |
| `--ng NG`              | Network Group ID or label                                      |
| `[--natural-name, -n]` | Show application names or aliases if possible (default: false) |
| `[--json, -j]`         | Show result in JSON format (default: false)                    |

#### `members get`

Get a Network Group member details

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Network Group ID or label                                                                            |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |
| `[--natural-name, -n]`      | Show application names or aliases if possible (default: false)                                       |
| `[--json, -j]`              | Show result in JSON format (default: false)                                                          |

#### `members add`

Add an app or addon as a Network Group member

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Network Group ID or label                                                                            |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |
| `--type MEMBER_TYPE`        | The member type ('application', 'addon' or 'external')                                               |
| `--domain-name DOMAIN_NAME` | Member name used in the `<memberName>.m.<ngID>.ng.clever-cloud.com` domain name alias                |
| `[--label] MEMBER_LABEL`    | The member label                                                                                     |

#### `members remove`

Remove an app or addon from a Network Group

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Network Group ID or label                                                                            |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |

---

### `peers`

List commands for interacting with Network Groups peers

#### `peers list`

List peers of a Network Group

| Param             | Description                                 |
| ----------------- | ------------------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false)             |
| --ng NG           | Network Group ID or label                   |
| [--json, -j]      | Show result in JSON format (default: false) |

#### `peers get`

Get a Network Group peer details

| Param               | Description                                 |
| ------------------- | ------------------------------------------- |
| `[--verbose, -v]`   | Verbose output (default: false)             |
| `--ng NG`           | Network Group ID or label                   |
| `--peer-id PEER_ID` | The peer ID                                 |
| `[--json, -j]`      | Show result in JSON format (default: false) |

#### `peers add-external`

Add an external node as a Network Group peer

| Param                     | Description                                       |
| ------------------------- | ------------------------------------------------- |
| `[--verbose, -v]`         | Verbose output (default: false)                   |
| `--ng NG`                 | Network Group ID or label                         |
| `--role PEER_ROLE`        | The peer role, ('client' or 'server')             |
| `--public-key PUBLIC_KEY` | A WireGuard® public key                           |
| `--label PEER_LABEL`      | Network Group peer label                          |
| `--parent MEMBER_ID`      | Network Group peer category ID (parent member ID) |

#### `peers remove-external`

Remove an external node from a Network Group

| Param               | Description                     |
| ------------------- | ------------------------------- |
| `[--verbose, -v]`   | Verbose output (default: false) |
| `--ng NG`           | Network Group ID or label       |
| `--peer-id PEER_ID` | The peer ID                     |
