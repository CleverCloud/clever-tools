# Networkgroups CLI commands

This document is a list of all networkgroup-related commands.

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

List networkgroups commands

### `list`

List networkgroups with their labels

| Param             | Description                                 |
| ----------------- | ------------------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false)             |
| `[--json, -j]`    | Show result in JSON format (default: false) |

---

### `create`

Create a networkgroup

| Param                          | Description                                                         |
| ------------------------------ | ------------------------------------------------------------------- |
| `[--verbose, -v]`              | Verbose output (default: false)                                     |
| `--label NG_LABEL`             | Networkgroup label, also used for dns context                       |
| `--description NG_DESCRIPTION` | Networkgroup description                                            |
| `[--tags] TAGS`                | List of tags separated by a comma                                   |
| `[--interactive]`              | Answer questions instead of passing optional flags (default: false) |
| `[--json, -j]`                 | Show result in JSON format (default: false)                         |

---

### `delete`

Delete a networkgroup

| Param             | Description                     |
| ----------------- | ------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false) |
| `--ng NG`         | Networkgroup ID or label        |

---

### `join`

Join a networkgroup

| Param                                       | Description                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `[--verbose, -v]`                           | Verbose output (default: false)                                     |
| `--ng NG`                                   | Networkgroup ID or label                                            |
| `--label PEER_LABEL`                        | Networkgroup peer label                                             |
| `[--private-key PRIVATE_KEY]`               | A WireGuard private key                                             |
| `[--node-category-id, -c] NODE_CATEGORY_ID` | The external node category ID                                       |
| `[--role] PEER_ROLE`                        | The peer role, ('client' or 'server') (default: client)             |
| `[--ip] IP_ADDRESS`                         | An IP address                                                       |
| `[--port] PORT_NUMBER`                      | A port number                                                       |
| `[--interactive]`                           | Answer questions instead of passing optional flags (default: false) |

---

### `leave`

Manually leave a networkgroup if a problem occured

| Param                 | Description              |
| --------------------- | ------------------------ |
| `--ng NG`             | Networkgroup ID or label |
| `[--peer-id] PEER_ID` | The peer ID              |

---

### `members`

List commands for interacting with networkgroups members

#### `members list`

List members of a networkgroup

| Param                  | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `[--verbose, -v]`      | Verbose output (default: false)                                |
| `--ng NG`              | Networkgroup ID or label                                       |
| `[--natural-name, -n]` | Show application names or aliases if possible (default: false) |
| `[--json, -j]`         | Show result in JSON format (default: false)                    |

#### `members get`

Get a networkgroup member details

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Networkgroup ID or label                                                                             |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |
| `[--natural-name, -n]`      | Show application names or aliases if possible (default: false)                                       |
| `[--json, -j]`              | Show result in JSON format (default: false)                                                          |

#### `members add`

Add an app or addon as a networkgroup member

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Networkgroup ID or label                                                                             |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |
| `--type MEMBER_TYPE`        | The member type ('application', 'addon' or 'external')                                               |
| `--domain-name DOMAIN_NAME` | Member name used in the `<memberName>.m.<ngID>.ng.clever-cloud.com` domain name alias                |
| `[--label] MEMBER_LABEL`    | The member label                                                                                     |

#### `members remove`

Remove an app or addon from a networkgroup

| Param                       | Description                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `[--verbose, -v]`           | Verbose output (default: false)                                                                      |
| `--ng NG`                   | Networkgroup ID or label                                                                             |
| `--member-id, -m MEMBER_ID` | The member ID: an app ID (i.e. `app_xxx`), add-on ID (i.e. `addon_xxx`) or external node category ID |

---

### `peers`

List commands for interacting with networkgroups peers

#### `peers list`

List peers of a networkgroup

| Param             | Description                                 |
| ----------------- | ------------------------------------------- |
| `[--verbose, -v]` | Verbose output (default: false)             |
| --ng NG           | Networkgroup ID or label                    |
| [--json, -j]      | Show result in JSON format (default: false) |

#### `peers get`

Get a networkgroup peer details

| Param               | Description                                 |
| ------------------- | ------------------------------------------- |
| `[--verbose, -v]`   | Verbose output (default: false)             |
| `--ng NG`           | Networkgroup ID or label                    |
| `--peer-id PEER_ID` | The peer ID                                 |
| `[--json, -j]`      | Show result in JSON format (default: false) |

#### `peers add-external`

Add an external node as a networkgroup peer

| Param                     | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `[--verbose, -v]`         | Verbose output (default: false)                  |
| `--ng NG`                 | Networkgroup ID or label                         |
| `--role PEER_ROLE`        | The peer role, ('client' or 'server')            |
| `--public-key PUBLIC_KEY` | A WireGuard public key                           |
| `--label PEER_LABEL`      | Networkgroup peer label                          |
| `--parent MEMBER_ID`      | Networkgroup peer category ID (parent member ID) |

#### `peers remove-external`

Remove an external node from a networkgroup

| Param               | Description                     |
| ------------------- | ------------------------------- |
| `[--verbose, -v]`   | Verbose output (default: false) |
| `--ng NG`           | Networkgroup ID or label        |
| `--peer-id PEER_ID` | The peer ID                     |
