/** User as returned by `GET /v2/self`. */
export interface RawUser {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zipcode: string | null;
  country: string | null;
  avatar: string | null;
  creationDate: number;
  lang: string;
  emailValidated: boolean;
  oauthApps: Array<string>;
  admin: boolean;
  canPay: boolean;
  preferredMFA: string | null;
  hasPassword: boolean;
  partnerId: string;
  partnerName: string;
  partnerConsoleUrl: string;
  contextFlags: Array<string>;
}

/** Raw item of `GET /v2/organisations/{id}/members`, as returned by the API. */
export interface RawMember {
  member: Pick<RawUser, 'id' | 'email' | 'name' | 'avatar' | 'preferredMFA'>;
  role: string;
  job: string | null;
}

/** The logged in user. */
export const USER_SELF = {
  id: 'user_00000000-0000-4000-8000-000000000100',
  email: 'marie.dubois@example.com',
  name: 'Marie Dubois',
  phone: '+33600000000',
  address: "12 rue de l'Exemple",
  city: 'Paris',
  zipcode: '75001',
  country: 'FRANCE',
  avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000.jpg',
  creationDate: 1700000000000,
  lang: 'EN',
  emailValidated: true,
  oauthApps: ['github'],
  admin: false,
  canPay: true,
  preferredMFA: 'TOTP',
  hasPassword: true,
  partnerId: '00000000-0000-0000-0000-000000000000',
  partnerName: 'default',
  partnerConsoleUrl: 'https://console.clever-cloud.com',
  contextFlags: [],
} satisfies RawUser;

export const USER_GIULIA = {
  id: 'user_00000000-0000-4000-8000-000000000101',
  email: 'giulia.rossi@example.com',
  name: 'Giulia Rossi',
  phone: '+390600000000',
  address: "Via dell'Esempio 23",
  city: 'Roma',
  zipcode: '00184',
  country: 'ITALY',
  avatar: null,
  creationDate: 1700000000000,
  lang: 'EN',
  emailValidated: true,
  oauthApps: [],
  admin: false,
  canPay: true,
  preferredMFA: 'TOTP',
  hasPassword: true,
  partnerId: '00000000-0000-0000-0000-000000000000',
  partnerName: 'default',
  partnerConsoleUrl: 'https://console.clever-cloud.com',
  contextFlags: [],
} satisfies RawUser;

export const USER_LUKAS = {
  id: 'user_00000000-0000-4000-8000-000000000102',
  email: 'lukas.schmidt@example.com',
  name: 'Lukas Schmidt',
  phone: '+4930000000',
  address: 'Beispielstraße 45',
  city: 'Berlin',
  zipcode: '10115',
  country: 'GERMANY',
  avatar: null,
  creationDate: 1700000000000,
  lang: 'EN',
  emailValidated: true,
  oauthApps: [],
  admin: false,
  canPay: true,
  preferredMFA: 'TOTP',
  hasPassword: true,
  partnerId: '00000000-0000-0000-0000-000000000000',
  partnerName: 'default',
  partnerConsoleUrl: 'https://console.clever-cloud.com',
  contextFlags: [],
} satisfies RawUser;

export const USER_JAN = {
  id: 'user_00000000-0000-4000-8000-000000000103',
  email: 'jan.kowalski@example.com',
  name: 'Jan Kowalski',
  phone: '+48220000000',
  address: 'ul. Przykładowa 56',
  city: 'Warszawa',
  zipcode: '00-001',
  country: 'POLAND',
  avatar: null,
  creationDate: 1700000000000,
  lang: 'EN',
  emailValidated: true,
  oauthApps: [],
  admin: false,
  canPay: true,
  preferredMFA: 'TOTP',
  hasPassword: true,
  partnerId: '00000000-0000-0000-0000-000000000000',
  partnerName: 'default',
  partnerConsoleUrl: 'https://console.clever-cloud.com',
  contextFlags: [],
} satisfies RawUser;

/**
 * Raw body of `GET /v2/organisations/{id}/members`, listing the given users with their role in the organisation. The
 * role belongs to the membership, not to the user, and `member` only keeps the fields of the user the API returns.
 *
 * @example
 * rawMembers([
 *   { user: USER_SELF, role: 'ADMIN' },
 *   { user: { ...USER_GIULIA, name: null }, role: 'DEVELOPER', job: 'CTO' },
 * ]);
 */
export function rawMembers(memberships: Array<{ user: RawUser; role: string; job?: string | null }>): Array<RawMember> {
  return memberships.map(({ user, role, job = null }) => ({
    member: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      preferredMFA: user.preferredMFA,
    },
    role,
    job,
  }));
}
