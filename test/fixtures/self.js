import { USER_ID } from './id.js';

export const SELF = {
  id: USER_ID,
  email: 'test.user@example.com',
  name: 'Test User',
  phone: '+33600000000',
  address: '1 rue de Test',
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
};
