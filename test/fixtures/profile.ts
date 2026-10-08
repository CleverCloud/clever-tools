import { SELF } from './self.ts';

/**
 * Build a default profile config (version 1) seeded by `withConfigFile(...)`.
 * Pass overrides to customize the active profile (alias, token, secret, …).
 */
export function profileConfig(
  overrides: Partial<{ alias: string; token: string; secret: string; userId: string; email: string }> = {},
) {
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
