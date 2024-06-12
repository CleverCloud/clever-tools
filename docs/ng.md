# Clever Cloud Network Groups

Network Groups (NG) are a way to create a private secure network between resources inside Clever Cloud infrastructure, using [Wireguard](https://www.wireguard.com/). It's also possible to connect external resources to a Network Group. There are three components to this feature:

* Network Group: A group of resources that can communicate with each through an encrypted tunnel
* Member: A resource that can be part of a Network Group (`application`, `addon` or `external`)
* Peer: Instance of a resource connected to a Network Group (can be `external`)

A Network Group is defined by an ID (`ngId`) and a `label`. It can be completed by a `description` and `tags`.

> [!NOTE]
> Network Groups are currently in public alpha testing phase. You only need a Clever Cloud account to use them.

Tell us what you think of Network Groups and what features you need from it in [the dedicated section of our Github Community](https://github.com/CleverCloud/Community/discussions/categories/network-groups).

## How it works

When you create a Network Group, a Wireguard configuration is generated with a corresponding [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing). Then, you can, for example, add a Clever Cloud application and an associated add-on to the same Network Group. These are members, defined by an `id`, a `label`, a `type` and a `domain name`.

When an application connects to a Network Group, you can reach it on any port inside a NG through its domain name. Any instance of this application is a peer, you can reach independently through an IP (from the attributed CIDR). It works the same way for add-ons and external resources. During alpha testing phase, only applications are supported.

> [!TIP]
> A Network Group member domain name is composed this way: `<memberID>.members.<ngID>.ng.clever-cloud.com`

## Prerequisites

To use Network Groups, you need [Clever Tools installed](/docs/setup-systems.md) in a version equals or higher than `3.9.0`. You can check your version with the following command:

```
clever version
```

To activate the Network Groups feature, you need to create a `clever-tools-features.json` file in your `~/.config/clever-cloud/` directory with the following content:

```json
{
  "ng": true
}
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
clever ng create myNG --members-ids appId1,appId2
```

You can add a description, tags and ask for a JSON output (`--format` or `-F`):

```
clever ng create myNG --description "My first NG" --tags test,ng -F json
```

## List Network Groups

Once created, you can list your Network Groups:

```
clever ng list

┌─────────┬───────-┬─────────-─┬───────────────┬─────────────────┬─────────┬───────┐
| (index) │ id     │ label     │ networkIp     │ lastAllocatedIp │ members │ peers │
├─────────┼────────┼───────────┼───────────────┼─────────────────┼─────────┼───────┤
│ 0       │ 'ngId' │ 'ngLabel' │ '10.x.y.z/16' │ '10.x.y.z'      │ X       │ Y     │
└─────────┴────────┴──────────-┴───────────────┴─────────────────┴─────────┴───────┘
```

A `json` formatted output is available.

## Delete Network Groups

You can delete a Network Group through its ID or label:

```
clever ng delete ngId
clever ng delete ngLabel
```

## Manage members of a Network Group

To add an application to a Network Group (a `label` is optional):

```
clever ng members add ngId appId
clever ng members add ngId appId --label 'member label'
```

To get information about members (a `json` formatted output is available):

```
clever ng members list ngId_or_ngLabel
clever ng members get ngId_or_ngLabel memberId
```

To delete a member from a Network Group:

```
clever ng members remove ngId_or_ngLabel memberId
```

## Manage peers of a Network Group

To get information about peers (a `json` formatted output is available):

```
clever ng peers list ngId_or_ngLabel
clever ng peers get ngId_or_ngLabel peerId
```

## Demos & examples

You can find ready to deploy projects using Network Groups in the following repositories:

- XXX

Create your own and let us know!
