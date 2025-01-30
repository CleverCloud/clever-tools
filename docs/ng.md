# Clever Cloud Network Groups

Network Groups (NG) are a way to create a private secure network between resources inside Clever Cloud infrastructure, using [Wireguard](https://www.wireguard.com/). It's also possible to connect external resources to a Network Group. There are three components to this feature:

* Network Group: a group of resources that can communicate with each through an encrypted tunnel
* Member: a resource that can be part of a Network Group (`application`, `addon` or `external`)
* Peer: Instance of a resource connected to a Network Group (can be `external`)

A Network Group is defined by an ID (`ngId`) and a `label`. It can be completed by a `description` and `tags`.

> [!NOTE]
> Network Groups are currently in public beta testing phase. You only need a Clever Cloud account to use them.

Tell us what you think of Network Groups and what features you need from it in [the dedicated section of our GitHub Community](https://github.com/CleverCloud/Community/discussions/categories/network-groups).

## How it works

When you create a Network Group, a Wireguard configuration is generated with a corresponding [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing). Then, you can, for example, add a Clever Cloud application and an associated add-on to the same Network Group. These are members, defined by an `id`, a `label`, a `kind` and a `domain name`.

When an application connects to a Network Group, you can reach it on any port inside a NG through its domain name. Any instance of this application is a peer, you can reach independently through an IP (from the attributed CIDR). It works the same way for add-ons and external resources. During alpha testing phase, only applications are supported.

> [!TIP]
> A Network Group member domain name is composed this way: `<memberID>.m.<ngID>.ng-cc.cloud`

## Prerequisites

To use Network Groups, you need [an alpha release of Clever Tools](https://github.com/CleverCloud/clever-tools/pull/780).

Activate `ng` feature flag to manage Network Groups:

```
clever features enable ng
```

Then, check it works with the following command:

```
clever ng
```

In all the following examples, you can target a specific organization with the `--org` or `-o` option.

## Create a Network Group

A Network Group is simple to create:

```
clever ng create myNG
```

You can create it declaring its members:

```
clever ng create myNG --link app_xxx,addon_xxx
```

You can add a description and tags:

```
clever ng create myNG --description "My first NG" --tags test,ng
```

## Delete Network Groups

You can delete a Network Group through its ID or label:

```
clever ng delete ngId
clever ng delete ngLabel
```

## List Network Groups

Once created, you can list your Network Groups:

```
clever ng

┌─────────┬───────-┬─────────-─┬───────────────┬─────────┬───────┐
| (index) │ ID     │ Label     │ Network CIDR  │ Members │ Peers │
├─────────┼────────┼───────────┼───────────────┼─────────┼───────┤
│ 0       │ 'ngId' │ 'ngLabel' │ '10.x.y.z/16' │ X       │ Y     │
└─────────┴────────┴──────────-┴───────────────┴─────────┴───────┘
```

A `json` formatted output is available with the `--format/-F json` option.

## (Un)Link a resource to a Network Group

To (un)link an application, add-on or external peer to a Network Group:

```
clever ng members link app_xxx ngIdOrLabel
clever ng members unlink addon_xxx ngIdorLabel
```

## Get information of a Network Group, a member or a peer

To get information about a network group or a resource (a `json` formatted output is available):

```
clever ng get ngIdOrLabel -F json
clever ng get resourceIdOrName
```

You can also search for network groups, members or peers:

```
clever ng search text_to_search -F json
```

> [!NOTE]
> The search command is case-insensitive and will return all resources containing the search string
> The get command look for an exact match and will return an error if multiple resources are found

## Get the Wireguard configuration of a Peer

To get the Wireguard configuration of a peer (a `json` formatted output is available):

```
clever ng get-config peerIdOrLabel myNG
```

## Demos & examples

You can find ready to deploy projects using Network Groups in the following repositories:

- XXX

Create your own and [let us know](https://github.com/CleverCloud/Community/discussions/categories/network-groups)!
