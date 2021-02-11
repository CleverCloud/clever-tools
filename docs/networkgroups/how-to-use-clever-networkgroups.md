# How to use `clever networkgroups`

- [Overview](#overview)
- [How to create & join networkgroups with the `clever` CLI?](#how-to-create--join-networkgroups-with-the-clever-cli)
  - [Create a networkgroup](#create-a-networkgroup)
  - [List created networkgroups](#list-created-networkgroups)
  - [Add a member](#add-a-member)
  - [List members in a networkgroup](#list-members-in-a-networkgroup)
  - [Add an external node category](#add-an-external-node-category)
  - [Join a networkgroup](#join-a-networkgroup)
  - [Delete a networkgroup](#delete-a-networkgroup)
- [Tips](#tips)
  - [`--json` or `-j` shows output as JSON](#--json-or--j-shows-output-as-json)
  - [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)
  - [Use `--interactive` to answer optional questions](#use---interactive-to-answer-optional-questions)

## Overview

> TODO: Describe networkgroups

## How to create & join networkgroups with the `clever` CLI?

Under each command, I added an example output for you to see what you're supposed to get.

> **Disclaimer:** It might not be up-to-date. Please warn us or <TODO: explain how to contribute on GitHub> if you see anything that's changed.

**General tips:**

- `clever ng` is an alias for `clever networkgroups`. I'll use it to make commands more readable.
- Command arguments order do not matter, but to have similar commands, I used the convention of placing `--ng NG_ID_OR_LABEL` just after `clever ng`.
- You can add `--help` or `-?` to print help about a command usage.
- You can add `--verbose` or `-v` to run commands in verbose mode if you need more details about what's happening under the hood (for debug purposes for example).

### Create a networkgroup

To create a networkgroup, you need to provide a label and a description. The label is <TODO: Explain why it cannot contain spaces> and the description is just for you to remember what the networkgroup is about.

An example usage would be:

```sh
clever ng create --label 'first-ng' --description 'My first networkgroup'
```

```log
Networkgroup 'first-ng' was created with the id 'ng_bcce10f3-ec6a-4d51-8e28-50cd622d2ecb'.
```

**Tips:**

- You can add `--tags tag1,tag2,tag3` to provide tags for networkgroups management.
- [Use `--interactive` to answer optional questions](#use---interactive-to-answer-optional-questions)

### List created networkgroups

To check the list of networkgroups you created, you can run:

```sh
clever ng list
```

After [Create a networkgroup](#create-a-networkgroup), you should get:

```log
Networkgroup ID                           Label                 Members  Peers  Description
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
ng_bcce10f3-ec6a-4d51-8e28-50cd622d2ecb   first-ng              0        0      My first networkgroup
```

**Tip:** [`--json` or `-j` shows output as JSON](#--json-or--j-shows-output-as-json)

### Add a member

After [creating a networkgroup](#create-a-networkgroup), you can add members to it. A member is an app, an add-on or an [external node category](TODO: Redirect to doc). You can set `--type` to `'application'`, `'addon'` or `'external'` according to your needs.

For example, to add an app to the networkgroup, you can do:

```sh
clever ng --ng 'first-ng' members add --member-id 'app_d60ef23d-80d7-4095-b8d7-7f42bea137ea' --type 'application' --domain-name 'my-app-1' --label 'My app 1'
```

```log
Successfully added member 'app_d60ef23d-80d7-4095-b8d7-7f42bea137ea' to networkgroup 'ng_bcce10f3-ec6a-4d51-8e28-50cd622d2ecb'.
```

**Tips:**

- [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)
- `--label` is optional, but it's a good practice to add it.

### List members in a networkgroup

To list the members in a networkgroup, run `clever ng members list`. For example, after ["Add a member"](#add-a-member), you could run:

```sh
clever ng --ng 'first-ng' members list
```

You should get something like:

```log
Member ID                                 Member Type                Label                                     Domain Name
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
app_d60ef23d-80d7-4095-b8d7-7f42bea137ea  application                My app 1                                  my-app-1
```

**Tips:**

- [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)
- [`--json` or `-j` shows output as JSON](#--json-or--j-shows-output-as-json)

### Add an external node category

External node categories are <TODO>. You can have plenty of them, as it helps keeping this organized.

Adding an external node category is very similar to the example in ["Add a member"](#add-a-member), except you'll use a custom member ID and `'external'` for the `--type`.

Here is an example:

```sh
clever ng --ng 'first-ng' members add --member-id 'dev-laptops-category' --type 'external' --domain-name 'dev-laptops' --label 'Developer laptops'
```

> I voluntarily used `--member-id` and `--domain-name` but you can have similar ones if you want.

```log
Successfully added member 'dev-laptops-category' to networkgroup 'ng_bcce10f3-ec6a-4d51-8e28-50cd622d2ecb'.
```

**Tip:** [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)

### Join a networkgroup

To join a networkgroup, you need to [add an external node category](#add-an-external-node-category) and run `sudo clever ng join`. This command uses `wg-quick` under the hood, which needs privileges to create network interfaces. That's why you need to use `sudo`.

> Clever Cloud's networkgroups use WireGuard®. Therefore, this command requires WireGuard® commands available on your computer.
>
> Follow instructions at <https://www.wireguard.com/install/> to install it.

After ["Add an external node category"](#add-an-external-node-category), you could run:

```sh
sudo clever ng --ng 'first-ng' join --node-category-id 'dev-laptops-category'
```

```log
TODO
```

When you join a networkgroup, your CLI hangs. Hit <kbd><kbd>Ctrl</kbd>+<kbd>C</kbd></kbd> or anything else that produces `SIGINT` or `SIGTERM` and the CLI will automatically leave the networkgroup. In case some problem happened, or you sent a `SIGKILL` signal, you can run `sudo clever ng leave` to leave the networkgroup and clean residual files. These are stored in your OS's temporary folder (e.g. `/tmp`), so they will be deleted at some point anyway.

**Tips:**

- [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)
- [Use `--interactive` to answer optional questions](#use---interactive-to-answer-optional-questions)
- `-c` is a short alias for `--node-category-id`.
- `--private-key` allows you to provide a custom WireGuard® private key if you need.

### Delete a networkgroup

To delete a networkgroup, it's as easy as running

```sh
clever ng delete --ng 'first-ng'
```

```log
Networkgroup 'ng_bcce10f3-ec6a-4d51-8e28-50cd622d2ecb' was successfully deleted.
```

**Tip:** [`--ng` takes a networkgroup label or ID](#--ng-takes-a-networkgroup-label-or-id)

## Tips

### `--json` or `-j` shows output as JSON

In many commands, you can add `--json` or `-j` to have the output as a JSON (and with a lot more data).

### `--ng` takes a networkgroup label or ID

`--ng` takes a networkgroup label or ID, so you can use the one that fits best your needs.

### Use `--interactive` to answer optional questions

If you add `--interactive` to a command, it will ask questions for missing arguments.
