// Members are not put back: `normalizeMemberKind` uppercases their `kind`, and the API returns it in
// lower or mixed case depending on the member, so the original case is lost before the CLI sees it.

/**
 * Inverse of what `ListNetworkGroupCommand` and `GetNetworkGroupCommand` apply to a network group:
 * the network group and its members are passed through, only its peers are transformed.
 *
 * @param {import('@clevercloud/client/cc-api-commands/network-group/network-group.types.js').NetworkGroup} networkGroup
 * @returns {import('./network-group.legacy.types.js').LegacyNetworkGroup}
 */
export function toLegacyNetworkGroup(networkGroup) {
  return {
    ...networkGroup,
    peers: networkGroup.peers.map(toLegacyNetworkGroupPeer),
  };
}

/**
 * Inverse of `transformNetworkGroupPeer` in
 * `@clevercloud/client/cc-api-commands/network-group/network-group-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/network-group/network-group.types.js').NetworkGroupPeer} peer
 * @returns {import('./network-group.legacy.types.js').LegacyNetworkGroupPeer}
 */
export function toLegacyNetworkGroupPeer(peer) {
  const base = {
    id: peer.id,
    // the transform turns the API's `null` into an absent key
    label: peer.label ?? null,
    publicKey: peer.publicKey,
    endpoint: toLegacyNetworkGroupEndpoint(peer.endpoint),
    hostname: peer.hostname,
    parentMember: peer.parentMember,
    parentEvent: peer.parentEvent ?? null,
  };

  if (peer.type === 'CleverPeer') {
    return { ...base, type: 'CleverPeer', hv: peer.hypervisor };
  }

  return { ...base, type: 'ExternalPeer' };
}

/**
 * Inverse of `transformNetworkGroupEndpoint` in
 * `@clevercloud/client/cc-api-commands/network-group/network-group-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-commands/network-group/network-group.types.js').NetworkGroupEndpoint} endpoint
 * @returns {import('./network-group.legacy.types.js').LegacyNetworkGroupEndpoint}
 */
function toLegacyNetworkGroupEndpoint(endpoint) {
  if (endpoint.type === 'ServerEndpoint') {
    return {
      type: 'ServerEndpoint',
      ngTerm: endpoint.networkGroupTerm,
      publicTerm: endpoint.publicTerm,
    };
  }

  return {
    type: 'ClientEndpoint',
    ngIp: endpoint.networkGroupIp,
  };
}

/**
 * Inverse of what `SearchNetworkGroupCommand` applies to a search result, which mixes network
 * groups, members and peers.
 *
 * @param {import('@clevercloud/client/cc-api-commands/network-group/network-group.types.js').NetworkGroupComponent} component
 * @returns {import('./network-group.legacy.types.js').LegacyNetworkGroupComponent}
 */
export function toLegacyNetworkGroupComponent(component) {
  switch (component.type) {
    case 'NetworkGroup':
      return { ...toLegacyNetworkGroup(component), type: 'NetworkGroup' };
    case 'Member':
      return component;
    case 'CleverPeer':
    case 'ExternalPeer':
      return toLegacyNetworkGroupPeer(component);
  }
}
