import colors from 'colors/safe.js';

import { select } from '@inquirer/prompts';
import { getOtoroshiApiParams, sendToOtoroshi } from './otoroshi.js';
import { createBiscuitVerifier, deleteBiscuitKeypair, genBiscuitKeypair, genBiscuitToken, getBiscuitKeypair, getBiscuitKeypairs, getBiscuitKeypairsTemplate, getBiscuitVerifiers, getBiscuitVerifierTemplate } from './otoroshi-instances-api.js';

export async function selectKeypair (addonIdOrName) {
  const otoroshi = await getOtoroshiApiParams(addonIdOrName);
  const keypairs = await getBiscuitKeypairs(otoroshi).then(sendToOtoroshi);

  if (!keypairs.length) {
    throw new Error(`No biscuit keypair found, please generate one first with ${colors.blue('clever biscuits gen-keypair')} command`);
  }

  let keypair = keypairs[0];
  if (keypairs.length > 1) {
    keypair = await select({
      type: 'select',
      name: 'keypairId',
      message: 'Select a keypair to use:',
      choices: keypairs.map((keypair) => ({
        name: `${keypair.name} (${keypair.pubKey})`,
        value: keypair,
      })),
    });
  }

  return keypair;
}

export async function getBiscuitsKeyPairTemplate (addonIdOrName) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return getBiscuitKeypairsTemplate(auth).then(sendToOtoroshi);
}

export async function getBiscuitsVerifierTemplate (addonIdOrName) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return getBiscuitVerifierTemplate(auth).then(sendToOtoroshi);
}

export async function getBiscuitsVerifiers (addonIdOrName) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return getBiscuitVerifiers(auth).then(sendToOtoroshi);
}

export async function createBiscuitsVerifier (addonIdOrName, body) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return createBiscuitVerifier(auth, body).then(sendToOtoroshi);
}

export async function genBiscuitsKeypair (addonIdOrName, body) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return genBiscuitKeypair(auth, body).then(sendToOtoroshi);
}

export async function deleteBiscuitsKeypair (addonIdOrName, keypairId) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return deleteBiscuitKeypair(auth, keypairId).then(sendToOtoroshi);
}

export async function genBiscuitsToken (addonIdOrName, body) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return genBiscuitToken(auth, body).then(sendToOtoroshi);
}

export async function getBiscuitsKeypair (addonIdOrName, keypairId) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return getBiscuitKeypair(auth, keypairId).then(sendToOtoroshi);
}

export async function getBiscuitsKeypairs (addonIdOrName) {
  const auth = await getOtoroshiApiParams(addonIdOrName);
  return getBiscuitKeypairs(auth).then(sendToOtoroshi);
}
