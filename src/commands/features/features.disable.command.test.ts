import { describe, it } from 'node:test';
import { assertCleverResult } from '../../../test/assert-clever-result.ts';
import { assertJsonFile, assertNoFile } from '../../../test/lib/fs/assert-file.ts';
import { setupCleverSandbox } from '../../../test/setup-clever-sandbox.ts';

describe('clever features disable', () => {
  const { fsMock, runClever } = setupCleverSandbox();

  describe('Happy path', () => {
    it('with a feature enabled in the file, should set it to false and print the confirmation', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });

      const result = await runClever(['features', 'disable', 'k8s']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'k8s' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: false });
    });

    it('with system-git, which is enabled by default, should store an explicit false', async () => {
      const result = await runClever(['features', 'disable', 'system-git']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'system-git' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { 'system-git': false });
    });

    it('with a feature disabled by default and no file, should create the file with an explicit false', async () => {
      const result = await runClever(['features', 'disable', 'ng']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'ng' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { ng: false });
    });

    it('with 2 features, should disable both and print one line per feature, without any hint', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true, ng: true });

      const result = await runClever(['features', 'disable', 'k8s,ng']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'k8s' disabled
          Experimental feature 'ng' disabled
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: false, ng: false });
    });

    it('with the same feature twice, should confirm it twice', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });

      const result = await runClever(['features', 'disable', 'k8s,k8s']);

      assertCleverResult(result, {
        exitCode: 0,
        stdoutText: `
          Experimental feature 'k8s' disabled
          Experimental feature 'k8s' disabled
        `,
      });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: false });
    });

    it('with a feature already disabled in the file, should print the same output and keep it disabled', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: false });

      const result = await runClever(['features', 'disable', 'k8s']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'k8s' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: false });
    });

    it('with an experimental features file holding other features, should keep them', async () => {
      fsMock.writeExperimentalFeaturesFile({ ng: true, operators: true });

      const result = await runClever(['features', 'disable', 'ng']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'ng' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { ng: false, operators: true });
    });

    it('with an experimental features file holding an unknown feature, should drop it from the file', async () => {
      // The unknown key is stripped when the file is loaded.
      fsMock.writeExperimentalFeaturesFile({ unknown: true, ng: true });

      const result = await runClever(['features', 'disable', 'ng']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'ng' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { ng: false });
    });
  });

  describe('CLI errors', () => {
    it('should reject a missing feature', async () => {
      const result = await runClever(['features', 'disable']);

      assertCleverResult(result, { exitCode: 1, usageError: 'features: missing value' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with an unknown feature, should fail and write nothing', async () => {
      const result = await runClever(['features', 'disable', 'foo']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a known and an unknown feature, should fail before disabling the known one', async () => {
      fsMock.writeExperimentalFeaturesFile({ k8s: true });

      const result = await runClever(['features', 'disable', 'k8s,foo']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo' });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: true });
    });

    it('with several unknown features, should list them all in the order given', async () => {
      const result = await runClever(['features', 'disable', 'foo,k8s,bar']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): foo, bar' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a feature name in another case, should fail', async () => {
      const result = await runClever(['features', 'disable', 'K8S']);

      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s): K8S' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a space after the comma, should fail with the name kept as typed', async () => {
      const result = await runClever(['features', 'disable', 'k8s, ng']);

      // The unknown name is " ng", with its leading space.
      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s):  ng' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });

    it('with a trailing comma, should fail on the empty name', async () => {
      const result = await runClever(['features', 'disable', 'k8s,']);

      // The unknown name is the empty string: the line ends with a space, trimmed by runCli().
      assertCleverResult(result, { exitCode: 1, stderrText: '[ERROR] Unavailable feature(s):' });
      assertNoFile(fsMock.experimentalFeaturesFilePath());
    });
  });

  describe('Environment errors', () => {
    it('with an experimental features file that is not writable, should fail', async () => {
      // A directory in place of the experimental features file makes the write fail.
      fsMock.write('config/clever-tools-experimental-features.json/placeholder', '');

      const result = await runClever(['features', 'disable', 'k8s']);

      assertCleverResult(result, {
        exitCode: 1,
        stderrText: `[ERROR] Cannot write experimental features configuration to ${fsMock.experimentalFeaturesFilePath()}`,
      });
    });

    it('with an experimental features file holding an invalid value, should replace the file content', async () => {
      // The file is ignored as a whole when one value is not a boolean: operators is lost too.
      fsMock.writeExperimentalFeaturesFile({ ng: 'yes', operators: true });

      const result = await runClever(['features', 'disable', 'k8s']);

      assertCleverResult(result, { exitCode: 0, stdoutText: "Experimental feature 'k8s' disabled" });
      assertJsonFile(fsMock.experimentalFeaturesFilePath(), { k8s: false });
    });
  });
});
