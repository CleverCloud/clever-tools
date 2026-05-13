import { SELF } from './self.js';

/**
 * Build a default profile config (version 1) seeded by `withConfigFile(...)`.
 * Pass overrides to customize the active profile (alias, token, secret, …).
 * @param {Partial<{ alias: string, token: string, secret: string, userId: string, email: string }>} [overrides]
 */
export function profileConfig(overrides = {}) {
  return {
    version: 1,
    profiles: [
      {
        alias: 'default',
        token: 'profile-token',
        secret: 'profile-secret',
        userId: SELF.id,
        email: SELF.email,
        ...overrides,
      },
    ],
  };
}
