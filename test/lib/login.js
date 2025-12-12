import * as cheerio from 'cheerio';
import cookie from 'cookie';
import timers from 'node:timers/promises';
import { TOTP } from 'totp-generator';
import { CcApiBridgeClient } from '../../src/clients/cc-api-bridge/cc-api-bridge-client.js';
import { CreateApiTokenCommand } from '../../src/clients/cc-api-bridge/commands/api-token/create-api-token-command.js';
import { DeleteApiTokenCommand } from '../../src/clients/cc-api-bridge/commands/api-token/delete-api-token-command.js';
import { CcApiClient } from '../../src/clients/cc-api/cc-api-client.js';
import { DeleteOauthTokenCommand } from '../../src/clients/cc-api/commands/oauth-token/delete-oauth-token-command.js';
import { getAllE2eUsers } from './e2e-test-users.js';

/**
 * @typedef {import('./e2e.types.js').E2eUser} E2eUser
 * @typedef {import('cheerio').CheerioAPI} CheerioAPI
 */

const OAUTH_CONSUMER_KEY = globalThis.process?.env.OAUTH_CONSUMER_KEY;
const OAUTH_CONSUMER_SECRET = globalThis.process?.env.OAUTH_CONSUMER_SECRET;

export async function login() {
  console.log('logging in all users');
  await Promise.all(getAllE2eUsers().map(loginUser));
  console.log('all users logged in');
}

export async function logout() {
  console.log('logging out all users');
  await Promise.all(getAllE2eUsers().map(logoutUser));
  console.log('all users logged out');
}

/**
 * @param {E2eUser} user
 */
async function loginUser(user) {
  console.log(`  login attempt for user ${user.userName} (${user.email})`);
  const oauthDance = new OauthDance({
    API_HOST: 'https://api.clever-cloud.com',
    OAUTH_CONSUMER_KEY: OAUTH_CONSUMER_KEY,
    OAUTH_CONSUMER_SECRET: OAUTH_CONSUMER_SECRET,
    OAUTH_CONSUMER_CALLBACK_URL: 'https://console.clever-cloud.com',
  });

  await oauthDance.postOauthRequestToken();
  let mfaCode;
  const requiresMfa = await oauthDance.postSessionsLogin(user.email, user.password);
  if (requiresMfa) {
    mfaCode = (await TOTP.generate(user.totpSecret)).otp;
    await oauthDance.postSessionsMfaLogin(mfaCode);
  }
  await timers.setTimeout(1000);
  const requiresOauthRights = await oauthDance.getOauthAuthorize();
  if (requiresOauthRights) {
    await oauthDance.postOauthAuthorize();
  }
  await timers.setTimeout(1000);
  const { oauthUserToken, oauthUserSecret } = await oauthDance.postOauthAccessToken();
  user.oauthTokens = {
    consumerKey: OAUTH_CONSUMER_KEY,
    consumerSecret: OAUTH_CONSUMER_SECRET,
    token: oauthUserToken,
    secret: oauthUserSecret,
  };
  console.log(`  login success for user ${user.userName} (${user.email})`);

  const client = new CcApiBridgeClient({ oauthTokens: user.oauthTokens });
  const { apiTokenId, apiToken } = await client.send(
    new CreateApiTokenCommand({
      email: user.email,
      password: user.password,
      mfaCode: mfaCode,
      description: 'Temporary tokens for clever-client.js E2E tests',
      name: 'client.js E2E tests',
      expirationDate: new Date(Date.now() + 1000 * 60 * 30),
    }),
  );
  user.apiToken = apiToken;
  user.apiTokenId = apiTokenId;
  console.log(`  api token creation success for user ${user.userName} (${user.email})`);
}

/**
 * @param {E2eUser} user
 */
async function logoutUser(user) {
  if (user.apiTokenId != null && user.oauthTokens != null) {
    const apiBridgeClient = new CcApiBridgeClient({ oauthTokens: user.oauthTokens });
    await apiBridgeClient.send(new DeleteApiTokenCommand({ apiTokenId: user.apiTokenId }));
    console.log(`  api token deletion success for user ${user.email}`);
  }

  if (user.oauthTokens != null) {
    const client = new CcApiClient({ authMethod: { type: 'oauth-v1', oauthTokens: user.oauthTokens } });
    await client.send(new DeleteOauthTokenCommand({ token: user.oauthTokens.token }));
    console.log(`  logout success for user ${user.email}`);
  }
}

/**
 * This class could have a more robust and secure implementation,
 * but we preferred a simpler approach for maintainability and readability.
 * This means that the order of the calls must be carefully followed:
 *
 * 1) postOauthRequestToken()
 * 2) postSessionsLogin()
 * 2bis) postSessionsMfaLogin (if necessary after postSessionsLogin())
 * 3) getOauthAuthorize()
 * 3bis) postOauthAuthorize (if necessary after getOauthAuthorize())
 * 4) postOauthAccessToken()
 */
class OauthDance {
  #API_HOST;
  #OAUTH_CONSUMER_KEY;
  #OAUTH_CONSUMER_SECRET;
  #OAUTH_CONSUMER_CALLBACK_URL;

  /**
   * @param {Object} config
   * @param {string} config.API_HOST - The API host URL
   * @param {string} config.OAUTH_CONSUMER_KEY - OAuth consumer key
   * @param {string} config.OAUTH_CONSUMER_SECRET - OAuth consumer secret
   * @param {string} config.OAUTH_CONSUMER_CALLBACK_URL - OAuth callback URL
   */
  constructor({ API_HOST, OAUTH_CONSUMER_KEY, OAUTH_CONSUMER_SECRET, OAUTH_CONSUMER_CALLBACK_URL }) {
    this.#API_HOST = API_HOST;
    this.#OAUTH_CONSUMER_KEY = OAUTH_CONSUMER_KEY;
    this.#OAUTH_CONSUMER_SECRET = OAUTH_CONSUMER_SECRET;
    this.#OAUTH_CONSUMER_CALLBACK_URL = OAUTH_CONSUMER_CALLBACK_URL;
  }

  //#region [1] get request token

  /** @type {string | null} */
  #oauthToken;
  /** @type {string | null} */
  #oauthTokenSecret;

  /**
   * @returns {Promise<void>}
   * @throws {OauthDanceError}
   */
  async postOauthRequestToken() {
    const response = await this.#postForm('/v2/oauth/request_token', {
      // eslint-disable-next-line camelcase
      oauth_consumer_key: this.#OAUTH_CONSUMER_KEY,
      // eslint-disable-next-line camelcase
      oauth_signature: this.#OAUTH_CONSUMER_SECRET + '&',
      // eslint-disable-next-line camelcase
      oauth_callback: this.#OAUTH_CONSUMER_CALLBACK_URL,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new OauthDanceError('1', `POST /v2/oauth/request_token: ${response.status}`, responseBody);
    }

    const encodedSearchParams = await response.text();
    const searchParams = new URLSearchParams(encodedSearchParams);

    this.#oauthToken = searchParams.get('oauth_token');
    this.#oauthTokenSecret = searchParams.get('oauth_token_secret');
  }

  //#endregion

  //#region [2] submit login form / submit MFA form

  /** @type {string | null} */
  #email;
  /** @type {string | null} */
  #mfaFormHtml;
  /** @type {string | null} */
  #ccid;

  /**
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<boolean>} - Returns true if MFA is required
   * @throws {InvalidCredentialError | OauthDanceError}
   */
  async postSessionsLogin(email, password) {
    const response = await this.#postForm('/v2/sessions/login', {
      email,
      pass: password,
      // eslint-disable-next-line camelcase
      from_authorize: 'true',
    });

    if (response.status === 401) {
      throw new InvalidCredentialError();
    }

    if (response.status === 200) {
      this.#email = email;
      this.#mfaFormHtml = await response.text();
      return true;
    }

    if (response.status === 303) {
      const cookies = cookie.parse(response.headers.get('set-cookie') || '');
      this.#ccid = cookies.ccid;
      return false;
    }

    const responseBody = await response.text();
    throw new OauthDanceError('2', `POST /v2/sessions/login: ${response.status}`, responseBody);
  }

  /**
   * @param {string} mfaCode - Multi-factor authentication code
   * @returns {Promise<void>}
   * @throws {InvalidMfaCodeError | OauthDanceError}
   */
  async postSessionsMfaLogin(mfaCode) {
    const $ = cheerio.load(this.#mfaFormHtml || '');

    const form = $('form[action="/v2/sessions/mfa_login"]');
    if (form.length !== 1) {
      throw new OauthDanceError('2bis', `MFA page does not have the expected HTML form`);
    }
    const mfaAuthId = $(form).find('input[type="hidden"][name="auth_id"]').attr('value');

    const response = await this.#postForm('/v2/sessions/mfa_login', {
      // eslint-disable-next-line camelcase
      mfa_attempt: mfaCode,
      // eslint-disable-next-line camelcase
      mfa_kind: 'TOTP',
      // eslint-disable-next-line camelcase
      auth_id: mfaAuthId,
      email: this.#email,
    });

    if (response.status === 401) {
      throw new InvalidMfaCodeError();
    }

    if (response.status === 303) {
      const cookies = cookie.parse(response.headers.get('set-cookie') || '');
      this.#ccid = cookies.ccid;
      return;
    }

    const responseBody = await response.text();
    throw new OauthDanceError('2bis', `POST /v2/sessions/mfa_login): ${response.status}`, responseBody);
  }

  //#endregion

  //#region [3] authorize / submit oauth rights form

  /** @type {string | null} */
  #oauthRightsHtml;
  /** @type {string | null} */
  #oauthVerifier;
  /** @type {string | null} */
  #userId;

  /**
   * @returns {Promise<boolean>} - Returns true if rights form needs to be submitted
   * @throws {OauthDanceError}
   */
  async getOauthAuthorize() {
    const response = await fetch(`${this.#API_HOST}/v2/oauth/authorize`, {
      redirect: 'manual',
      credentials: 'include',
      headers: {
        cookie: serializeCookies({
          cctk: this.#oauthToken,
          ccid: this.#ccid,
        }),
      },
    });

    if (response.status === 200) {
      this.#oauthRightsHtml = await response.text();
      return true;
    }

    if (response.status === 303) {
      const locationUrl = new URL(response.headers.get('location') || '');
      this.#oauthVerifier = locationUrl.searchParams.get('oauth_verifier');
      this.#userId = locationUrl.searchParams.get('user');
      return false;
    }

    const responseBody = await response.text();
    throw new OauthDanceError('3', `GET /v2/oauth/authorize): ${response.status}`, responseBody);
  }

  /**
   * @returns {Promise<void>}
   * @throws {OauthDanceError}
   */
  async postOauthAuthorize() {
    const $ = cheerio.load(this.#oauthRightsHtml || '');

    const form = $('form[action="/v2/oauth/authorize"]');
    if (form.length !== 1) {
      throw new OauthDanceError('3bis', `OAuth rights page does not have the expected HTML form`);
    }

    /** @type {Record<string, string>} */
    const oauthRights = $(form)
      .find('input[type="checkbox"]')
      .toArray()
      .reduce((/** @type {Record<string, string>} */ acc, input) => {
        const name = $(input).attr('name');
        if (name) {
          acc[name] = 'on';
        }
        return acc;
      }, {});

    if (Object.entries(oauthRights).length === 0) {
      throw new OauthDanceError('3bis', `OAuth rights page does not have the expected HTML checkboxes`);
    }

    const response = await this.#postForm('/v2/oauth/authorize', oauthRights, {
      cctk: this.#oauthToken,
      ccid: this.#ccid,
    });

    if (response.status === 303) {
      const locationUrl = new URL(response.headers.get('location') || '');
      this.#oauthVerifier = locationUrl.searchParams.get('oauth_verifier');
      this.#userId = locationUrl.searchParams.get('user');
      return;
    }

    const responseBody = await response.text();
    throw new OauthDanceError('3bis', `POST /v2/oauth/authorize): ${response.status}`, responseBody);
  }

  //#endregion

  //#region [4] get access token

  /** @type {string | null} */
  oauthUserToken;
  /** @type {string | null} */
  oauthUserSecret;

  /**
   * @returns {Promise<{ userId: string, oauthUserToken: string, oauthUserSecret: string }>}
   * @throws {OauthDanceError}
   */
  async postOauthAccessToken() {
    const response = await this.#postForm('/v2/oauth/access_token', {
      // eslint-disable-next-line camelcase
      oauth_consumer_key: this.#OAUTH_CONSUMER_KEY,
      // eslint-disable-next-line camelcase
      oauth_signature: this.#OAUTH_CONSUMER_SECRET + '&' + this.#oauthTokenSecret,
      // eslint-disable-next-line camelcase
      oauth_token: this.#oauthToken,
      // eslint-disable-next-line camelcase
      oauth_verifier: this.#oauthVerifier,
    });

    if (response.status === 200) {
      const encodedSearchParams = await response.text();
      const searchParams = new URLSearchParams(encodedSearchParams);
      return {
        userId: this.#userId,
        oauthUserToken: searchParams.get('oauth_token'),
        oauthUserSecret: searchParams.get('oauth_token_secret'),
      };
    }

    const responseBody = await response.text();
    throw new OauthDanceError('4', `POST /v2/oauth/access_token): ${response.status}`, responseBody);
  }

  //#endregion

  /**
   * @param {string} path - API endpoint path
   * @param {Record<string, string>} data - Form data
   * @param {Record<string, string>} [cookies] - Optional cookies to include
   * @returns {Promise<Response>}
   */
  #postForm(path, data, cookies) {
    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    if (cookies != null) {
      headers.cookie = serializeCookies(cookies);
    }

    const body = new URLSearchParams(data).toString();

    return fetch(`${this.#API_HOST}${path}`, {
      method: 'POST',
      headers,
      redirect: 'manual',
      credentials: 'include',
      body,
    });
  }
}

/**
 * Serialize cookies object into cookie header string
 * @param {Record<string, string>} cookies
 * @returns {string}
 */
function serializeCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => cookie.serialize(name, value))
    .join(';');
}

class AuthBackendError extends Error {
  /**
   * @param {string} message - The error message
   * @param {string} code - The error code
   * @param {number} statusCode - HTTP status code
   * @param {string} [details] - Additional error details
   * @param {Error} [cause] - The cause of the error
   */
  constructor(message, code, statusCode, details, cause) {
    super(message, { cause });
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class InvalidCredentialError extends AuthBackendError {
  constructor() {
    super('Invalid credential', 'invalid-credential', 401);
  }
}

export class InvalidMfaCodeError extends AuthBackendError {
  constructor() {
    super('Invalid MFA code', 'invalid-mfa-code', 401);
  }
}

class OauthDanceError extends AuthBackendError {
  /**
   * @param {string} step - The OAuth step that failed
   * @param {string} details - Details about the failure
   * @param {string} [body] - The response body of the API error
   */
  constructor(step, details, body = '') {
    super(
      'Token creation failed',
      `failed-token-creation-${step}`,
      500,
      `OAuth dance error [${step}] ${details} ${body}`,
    );
  }
}
