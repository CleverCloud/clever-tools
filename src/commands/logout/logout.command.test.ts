import fs from 'node:fs';
import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertFile, assertJsonFile, assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever logout', () => {
  const { fsMock, envMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with a single profile, should remove it and print the logout message', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: '✓ Logged out of profile default (test.user@example.com)',
      });
      assertJsonFile(fsMock.configFilePath(), { version: 1, profiles: [] });
    });

    it('with a profile without email, should print only the alias', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [{ alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET' }],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Logged out of profile default' });
      assertJsonFile(fsMock.configFilePath(), { version: 1, profiles: [] });
    });

    it('with 2 profiles, should remove the active one and switch to the next one', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Logged out of profile default (test.user@example.com)
          ✓ Switched active profile to work (work.user@example.com)
        `,
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [{ alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' }],
      });
    });

    it('with 3 profiles, should make the next profile in file order the active one and keep the order of the others', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
          { alias: 'third', token: 'THIRD_TOKEN', secret: 'THIRD_SECRET', email: 'third.user@example.com' },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Logged out of profile default (test.user@example.com)
          ✓ Switched active profile to work (work.user@example.com)
        `,
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
          { alias: 'third', token: 'THIRD_TOKEN', secret: 'THIRD_SECRET', email: 'third.user@example.com' },
        ],
      });
    });

    it('with --alias of the active profile, should remove it and switch to the next one', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', 'default']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Logged out of profile default (test.user@example.com)
          ✓ Switched active profile to work (work.user@example.com)
        `,
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [{ alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' }],
      });
    });

    it('with --alias of a profile that is not the active one, should remove it and keep the active profile', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
          { alias: 'third', token: 'THIRD_TOKEN', secret: 'THIRD_SECRET', email: 'third.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', 'work']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Logged out of profile work (work.user@example.com)' });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'third', token: 'THIRD_TOKEN', secret: 'THIRD_SECRET', email: 'third.user@example.com' },
        ],
      });
    });

    it('with remaining profiles having all their fields, should keep them untouched in the config file', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          {
            alias: 'work',
            token: 'WORK_TOKEN',
            secret: 'WORK_SECRET',
            expirationDate: '2030-01-01T00:00:00.000Z',
            userId: 'user_00000000-0000-4000-8000-000000000000',
            email: 'work.user@example.com',
            overrides: { API_HOST: 'https://api.example.com' },
          },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          ✓ Logged out of profile default (test.user@example.com)
          ✓ Switched active profile to work (work.user@example.com)
        `,
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          {
            alias: 'work',
            token: 'WORK_TOKEN',
            secret: 'WORK_SECRET',
            expirationDate: '2030-01-01T00:00:00.000Z',
            userId: 'user_00000000-0000-4000-8000-000000000000',
            email: 'work.user@example.com',
            overrides: { API_HOST: 'https://api.example.com' },
          },
        ],
      });
    });

    it('with a config file in the legacy format, should remove the default profile and rewrite the file in the current format', async () => {
      fsMock.writeConfigFile({ token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET' });

      const result = await runClever(['logout']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Logged out of profile default' });
      assertJsonFile(fsMock.configFilePath(), { version: 1, profiles: [] });
    });

    it('with only CLEVER_TOKEN set, should ignore it and log out from the active file profile', async () => {
      envMock.set('CLEVER_TOKEN', 'ENV_TOKEN');
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: '✓ Logged out of profile default (test.user@example.com)',
      });
      assertJsonFile(fsMock.configFilePath(), { version: 1, profiles: [] });
    });

    it('with CLEVER_TOKEN and CLEVER_SECRET and --alias of a file profile, should remove it and print only the logout message', async () => {
      envMock.set({ CLEVER_TOKEN: 'ENV_TOKEN', CLEVER_SECRET: 'ENV_SECRET' });
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', 'work']);

      assertCleverResult(result, { exitCode: 0, stdoutText: '✓ Logged out of profile work (work.user@example.com)' });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
    });
  });

  describe('Environment errors', () => {
    it('without config file, should fail with no profile found', async () => {
      const result = await runClever(['logout']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] No profile found, use clever login command' });
      assertNoFile(fsMock.configFilePath());
    });

    it('with a config file without profile, should fail with no profile found', async () => {
      fsMock.writeConfigFile({ version: 1, profiles: [] });

      const result = await runClever(['logout']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] No profile found, use clever login command' });
      assertJsonFile(fsMock.configFilePath(), { version: 1, profiles: [] });
    });

    it('with a config file that is not valid JSON, should fail with no profile found', async () => {
      fsMock.writeConfigFile('not json');

      const result = await runClever(['logout']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] No profile found, use clever login command' });
      assertFile(fsMock.configFilePath(), 'not json');
    });

    it('with an unknown --alias, should fail with profile not found and keep the config file', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', 'ghost']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Profile "ghost" not found.' });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
          { alias: 'work', token: 'WORK_TOKEN', secret: 'WORK_SECRET', email: 'work.user@example.com' },
        ],
      });
    });

    it('with CLEVER_TOKEN and CLEVER_SECRET and no --alias, should refuse to log out from the environment profile', async () => {
      envMock.set({ CLEVER_TOKEN: 'ENV_TOKEN', CLEVER_SECRET: 'ENV_SECRET' });
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] Cannot logout from environment-based profile, unset CLEVER_TOKEN and CLEVER_SECRET instead',
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
    });

    it('with CLEVER_TOKEN and CLEVER_SECRET and --alias $env, should refuse to log out from the environment profile', async () => {
      envMock.set({ CLEVER_TOKEN: 'ENV_TOKEN', CLEVER_SECRET: 'ENV_SECRET' });
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', '$env']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] Cannot logout from environment-based profile, unset CLEVER_TOKEN and CLEVER_SECRET instead',
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
    });

    it('with --alias $env and no CLEVER_TOKEN, should refuse to log out from the environment profile', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });

      const result = await runClever(['logout', '--alias', '$env']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText:
          '[ERROR] Cannot logout from environment-based profile, unset CLEVER_TOKEN and CLEVER_SECRET instead',
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
    });

    it('with a config file that cannot be written, should fail with the write error', async () => {
      fsMock.writeConfigFile({
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
      fs.chmodSync(fsMock.configFilePath(), 0o444);

      const result = await runClever(['logout']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `
          [ERROR] Cannot write configuration to ${fsMock.configFilePath()}
                  EACCES: permission denied, open '${fsMock.configFilePath()}'
        `,
      });
      assertJsonFile(fsMock.configFilePath(), {
        version: 1,
        profiles: [
          { alias: 'default', token: 'DEFAULT_TOKEN', secret: 'DEFAULT_SECRET', email: 'test.user@example.com' },
        ],
      });
    });
  });
});
