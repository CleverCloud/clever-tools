import { USER_SELF } from './user.ts';

/** Raw body of `GET /v2/organisations/{id}` (and of the `PUT` response), as returned by the API. */
export interface RawOrganisation {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  zipcode: string | null;
  country: string | null;
  company: string | null;
  VAT: string | null;
  avatar: string | null;
  vatState: string;
  customerFullName: string | null;
  canPay: boolean;
  cleverEnterprise: boolean;
  emergencyNumber: string | null;
  billingEmail: string | null;
  canSEPA: boolean;
  isTrusted: boolean;
  contextFlags: Array<string>;
}

export const ORGANISATION_FOO: RawOrganisation = {
  id: 'orga_00000000-0000-4000-8000-000000000200',
  name: 'Foo Inc',
  description: 'Main organisation',
  address: "34 rue de l'Exemple",
  city: 'Nantes',
  zipcode: '44000',
  country: 'FRANCE',
  company: null,
  VAT: null,
  avatar: null,
  vatState: 'NOT_APPLICABLE',
  customerFullName: USER_SELF.name,
  canPay: true,
  cleverEnterprise: false,
  emergencyNumber: null,
  billingEmail: 'billing@example.com',
  canSEPA: false,
  isTrusted: false,
  contextFlags: [],
};

export const ORGANISATION_BAR: RawOrganisation = {
  id: 'orga_00000000-0000-4000-8000-000000000201',
  name: 'Bar Inc',
  description: null,
  address: 'Voorbeeldstraat 78',
  city: 'Amsterdam',
  zipcode: '1012 LG',
  country: 'NETHERLANDS',
  company: 'Bar B.V.',
  VAT: 'NL000000000B01',
  avatar: null,
  vatState: 'VALID',
  customerFullName: USER_SELF.name,
  canPay: true,
  cleverEnterprise: false,
  emergencyNumber: null,
  billingEmail: 'billing@bar.example.com',
  canSEPA: false,
  isTrusted: false,
  contextFlags: [],
};

/**
 * Personal space of the current user (`USER_SELF`), as returned by `GET /v2/organisations/{id}`: an organisation with
 * the ID, the name, the avatar and the address of the user. Not to be confused with the organisations the user is a
 * member of.
 */
export const ORGANISATION_SELF: RawOrganisation = {
  id: USER_SELF.id,
  name: USER_SELF.name,
  description: 'Personal space',
  address: USER_SELF.address,
  city: USER_SELF.city,
  zipcode: USER_SELF.zipcode,
  country: USER_SELF.country,
  company: null,
  VAT: null,
  avatar: USER_SELF.avatar,
  vatState: 'NOT_APPLICABLE',
  customerFullName: USER_SELF.name,
  canPay: USER_SELF.canPay,
  cleverEnterprise: false,
  emergencyNumber: null,
  billingEmail: 'marie.dubois.billing@example.com',
  canSEPA: false,
  isTrusted: false,
  contextFlags: [],
};
