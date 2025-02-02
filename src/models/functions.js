import fs from 'node:fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { env } from 'node:process';

const COMPILATOR_URL = env.COMPILATOR_URL;
const COMPILATOR_TOKEN = env.COMPILATOR_TOKEN;

/**
 * Upload a function to the Compilator service
 * @param {string} uploadUrl - The URL of the upload endpoint
 * @param {string} inputFilepath - The path to the function to upload
 * @returns
 */
export function uploadFunction (uploadUrl, inputFilepath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(inputFilepath));
  return fetch(COMPILATOR_URL, {
    method: 'POST',
    body: formData,
    headers: {
      Authorization: `Bearer ${COMPILATOR_TOKEN}`,
      'X-Upload-URL': uploadUrl,
    },
  });
}
