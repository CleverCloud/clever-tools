import { USER_SELF } from './user.ts';

/** Network Group as returned by `GET /v4/networkgroups/organisations/:ownerId/networkgroups/:networkGroupId`. */
export interface RawNetworkGroup {
  id: string;
  ownerId: string;
  label: string;
  dnsSanitizedLabel: string | null;
  description: string | null;
  networkIp: string;
  lastAllocatedIp: string;
  tags: Array<string>;
  peers: Array<unknown>;
  members: Array<{ id: string; label: string; domainName: string; kind: string }>;
  version: number;
  ownership: unknown;
}

export const NETWORK_GROUP = {
  id: 'ng_00000000-0000-4000-8000-000000000800',
  ownerId: USER_SELF.id,
  label: 'my-network-group',
  dnsSanitizedLabel: null,
  description: 'Private network',
  networkIp: '10.101.0.0/16',
  lastAllocatedIp: '10.101.0.1',
  tags: ['env:prod'],
  peers: [],
  members: [],
  version: 1,
  ownership: null,
} satisfies RawNetworkGroup;
