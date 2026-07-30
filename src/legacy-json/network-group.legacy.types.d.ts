import type {
  NetworkGroup,
  NetworkGroupMember,
  TypedComponent,
} from '@clevercloud/client/cc-api-commands/network-group/network-group.types.js';

/**
 * A network group as the v4 API returns it, which is what `clever ng`, `clever ng get` and
 * `clever ng search` printed with `--format json` before the `@clevercloud/client` migration.
 * The client passes the network group's own fields through untouched, so only its members and
 * peers differ from the client shape.
 */
export type LegacyNetworkGroup = Omit<NetworkGroup, 'members' | 'peers'> & {
  members: Array<LegacyNetworkGroupMember>;
  peers: Array<LegacyNetworkGroupPeer>;
};

/**
 * A network group member as the v4 API returns it, except for the case of its `kind`, which the
 * client uppercases before the CLI sees it.
 */
export type LegacyNetworkGroupMember = NetworkGroupMember;

/** A network group peer as the v4 API returns it. */
export type LegacyNetworkGroupPeer = LegacyNetworkGroupPeerClever | LegacyNetworkGroupPeerExternal;

/** A peer hosted on the Clever Cloud platform, as the v4 API returns it. */
export interface LegacyNetworkGroupPeerClever extends LegacyNetworkGroupPeerBase {
  type: 'CleverPeer';
  /** Identifier of the hypervisor hosting the peer. */
  hv: string;
}

/** A peer joined to the network group from outside the platform, as the v4 API returns it. */
export interface LegacyNetworkGroupPeerExternal extends LegacyNetworkGroupPeerBase {
  type: 'ExternalPeer';
}

interface LegacyNetworkGroupPeerBase {
  id: string;
  label: string | null;
  publicKey: string;
  endpoint: LegacyNetworkGroupEndpoint;
  hostname: string;
  parentMember: string;
  parentEvent: string | null;
}

/** The endpoint of a network group peer, as the v4 API returns it. */
export type LegacyNetworkGroupEndpoint = LegacyNetworkGroupEndpointServer | LegacyNetworkGroupEndpointClient;

/** The endpoint of a listening peer, as the v4 API returns it. */
export interface LegacyNetworkGroupEndpointServer {
  type: 'ServerEndpoint';
  ngTerm: { host: string; port: number };
  publicTerm: { host: string; port: number };
}

/** The endpoint of a non listening peer, as the v4 API returns it. */
export interface LegacyNetworkGroupEndpointClient {
  type: 'ClientEndpoint';
  ngIp: string;
}

/** Any component a network group search can return, in the shape the v4 API returns it. */
export type LegacyNetworkGroupComponent =
  | TypedComponent<'NetworkGroup', LegacyNetworkGroup>
  | LegacyNetworkGroupMember
  | LegacyNetworkGroupPeer;
