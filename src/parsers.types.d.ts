// Application types
export interface AppId {
  app_id: string;
}

export interface AppName {
  app_name: string;
}

export type AppIdOrName = AppId | AppName;

// Organization types
export interface OrgaId {
  orga_id: string;
}

export interface OrgaName {
  orga_name: string;
}

export type OrgaIdOrName = OrgaId | OrgaName;

// Addon types
export interface AddonId {
  addon_id: string;
}

export interface OperatorId {
  operator_id: string;
}

export interface AddonName {
  addon_name: string;
}

export type AddonIdOrName = AddonId | OperatorId | AddonName;

// Network Group types
export interface NgId {
  ngId: string;
}

export interface MemberId {
  memberId: string;
}

export interface NgResourceLabel {
  ngResourceLabel: string;
}

export type NgResourceType = NgId | MemberId | NgResourceLabel;

export type NgValidType = 'NetworkGroup' | 'Member' | 'CleverPeer' | 'ExternalPeer';
