import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EnvMock } from './env-mock.ts';

const BASE_ENV = { HOME: '/home/test', NO_COLOR: '1' };

describe('EnvMock', () => {
  it('before the first reset, should be empty', () => {
    const envMock = new EnvMock();

    assert.deepEqual(envMock.toEnv(), {});
  });

  it('should start from a copy of the defaults on reset', () => {
    const envMock = new EnvMock();

    envMock.reset(BASE_ENV);

    const result = envMock.toEnv();
    assert.deepEqual(result, BASE_ENV);
    assert.notEqual(result, BASE_ENV);
  });

  it('should add and override variables', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);

    envMock.set('CLEVER_TOKEN', 'token');
    envMock.set('HOME', '/elsewhere');

    assert.deepEqual(envMock.toEnv(), { HOME: '/elsewhere', NO_COLOR: '1', CLEVER_TOKEN: 'token' });
  });

  it('should set several variables from an object', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);

    envMock.set({ CLEVER_TOKEN: 'token', HOME: '/elsewhere' });

    assert.deepEqual(envMock.toEnv(), { HOME: '/elsewhere', NO_COLOR: '1', CLEVER_TOKEN: 'token' });
  });

  it('should remove a variable of the defaults', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);

    envMock.unset('NO_COLOR');

    assert.deepEqual(envMock.toEnv(), { HOME: '/home/test' });
  });

  it('should keep the last call for a variable', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);

    envMock.unset('NO_COLOR');
    envMock.set('NO_COLOR', '0');

    assert.deepEqual(envMock.toEnv(), { HOME: '/home/test', NO_COLOR: '0' });
  });

  it('should not modify the defaults', () => {
    const defaults = { ...BASE_ENV };
    const envMock = new EnvMock();
    envMock.reset(defaults);

    envMock.set('HOME', '/elsewhere');
    envMock.unset('NO_COLOR');

    assert.deepEqual(defaults, BASE_ENV);
  });

  it('should not expose its state through the returned env', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);

    envMock.toEnv().HOME = '/elsewhere';

    assert.deepEqual(envMock.toEnv(), BASE_ENV);
  });

  it('should forget every set and unset on reset', () => {
    const envMock = new EnvMock();
    envMock.reset(BASE_ENV);
    envMock.set('CLEVER_TOKEN', 'token');
    envMock.unset('NO_COLOR');

    envMock.reset(BASE_ENV);

    assert.deepEqual(envMock.toEnv(), BASE_ENV);
  });
});
