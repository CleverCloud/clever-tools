import fs from 'node:fs';
import fetch from 'node-fetch';

/**
 * Upload a function to the deployment URL
 * @param {string} uploadUrl - The deployment URL
 * @param {string} inputFilepath - The path to the function file
 * @returns
 */
export function uploadFunction (uploadUrl, inputFilepath) {
  fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': fs.statSync(inputFilepath).size,
    },
    body: fs.createReadStream(inputFilepath),
  });
}
