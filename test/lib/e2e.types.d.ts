import type { OauthTokens } from '../../src/types/auth.types.js';

export type E2eUserName = 'test-user-without-github' | 'test-user-with-github';

export interface E2eUser {
  userName: E2eUserName;
  email: string;
  password: string;
  totpSecret?: string;
  newTemporaryPassword?: string;
  apiTokenId?: string;
  apiToken?: string;
  oauthTokens?: OauthTokens;
}
