import openPage from 'open';
import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { getHostAndTokens, sendToApi } from '../models/send-to-api.js';
import { getOwnerIdFromOrgaIdOrName } from '../models/utils.js';
import { listInvoices, getInvoice } from '../clever-client/billing.js';

import * as fs from 'node:fs';
import * as path from 'node:path';
import { addOauthHeaderPlaintext } from '../clever-client/auth-bridge.js';
import { btoa } from 'node:buffer';

/**
 * List invoices
 * @param {object} params The command parameters
 * @param {string} params.options.org The Organisation ID or name
 * @returns {Promise<void>}
 */
export async function list (params) {
  const { org } = params.options;

  const limit = 12;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const since = oneYearAgo.toISOString();
  const until = new Date().toISOString();

  const ownerId = await getOwnerIdFromOrgaIdOrName(org);
  const orgToPrint = org ? org[Object.keys(org)[0]] : ownerId;

  const invoices = await listInvoices({ ownerId, since, until, limit }).then(sendToApi);

  Logger.println(`🔎 Found ${invoices.length} invoices for ${colors.blue(orgToPrint)}:`);
  invoices.forEach((invoice) => {
    const invoiceDate = new Date(invoice.emission_date);

    Logger.println(colors.grey(` - ${invoice.invoice_number} (${invoiceDate.toLocaleDateString()} - ${invoice.status})`));
  });

}

/**
 * Download an invoice
 * @param {object} params The command parameters
 * @param {string} params.args[0].invoiceId The invoice ID
 * @param {object} params.options The command options
 * @param {string} params.options.output The output path
 * @param {boolean} params.options.open Whether to open the invoice in the browser
 * @returns {Promise<void>}
 */
export async function download (params) {
  const [invoiceId] = params.args;
  const { format, output, open, org } = params.options;

  const downloadFormat = format !== 'json' ? '.html' : '';
  const ownerId = await getOwnerIdFromOrgaIdOrName(org);
  const invoice = await getInvoice({ ownerId, invoiceId, format: downloadFormat }).then(sendToApi);

  switch (format) {
    case 'json':
      Logger.printJson(invoice);
      break;
    case 'human':
    default: {
      const filename = `invoice-${invoiceId}.html`;
      const workingPath = output ?? process.cwd();
      const filePath = path.join(workingPath, filename);
      fs.writeFileSync(filePath, invoice);

      const workingPathText = output ? ` in ${colors.green(workingPath)}` : '!';
      Logger.println(`📄 Invoice ${colors.green(invoiceId)} successfully downloaded${workingPathText}`);

      if (open) {
        await openPage(filePath, { wait: false });
      }
      break;
    }
  }
}

/**
 * Open the Invoices page in the Console
 * @param {object} params The command parameters
 * @param {string} params.options.org The Organisation ID or name
 * @returns {Promise<void>}
 */
export async function open (params) {
  const { invoiceId, org } = params.options;
  const ownerId = await getOwnerIdFromOrgaIdOrName(org);

  const orgToPrint = org ? org[Object.keys(org)[0]] : ownerId;

  if (invoiceId) {

    let invoiceToDownload = invoiceId;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const since = oneYearAgo.toISOString();
    const until = new Date().toISOString();

    if (invoiceId === 'latest') {
      const invoices = await listInvoices({ ownerId, limit: 1, since, until }).then(sendToApi);

      if (invoices.length < 1) {
        throw new Error(`No invoices found for ${colors.red(orgToPrint)} in the last year.`);
      }

      invoiceToDownload = invoices[0];
      const invoiceDate = new Date(invoiceToDownload.emission_date);
      Logger.println(`🔎 Found the latest invoice: ${colors.blue(invoiceToDownload.invoice_number)} (${invoiceDate.toLocaleDateString()} - ${invoiceToDownload.status}), open it in the browser...`);
    }

    // If invoiceId starts by a '-' with an int after, we consider it as a relative index
    if (!isNaN(invoiceId)) {
      const invoices = await listInvoices({ ownerId, limit: 12, since, until }).then(sendToApi);

      const index = parseInt(invoiceId, 10);
      if (index < 0 || index > (invoices.length + 1)) {
        throw new Error(`No invoice found at index ${colors.red(invoiceId)} for ${colors.red(orgToPrint)} in the last year.`);
      }

      invoiceToDownload = invoices[index];
      const invoiceDate = new Date(invoiceToDownload.emission_date);
      Logger.println(`🔎 Found invoice at index ${colors.blue(invoiceId)}: ${colors.blue(invoiceToDownload.invoice_number)} (${invoiceDate.toLocaleDateString()} - ${invoiceToDownload.status}), open it in the browser`);
    }

    const { tokens } = await getHostAndTokens();

    const ownerAuth = await Promise.resolve({})
      .then(addOauthHeaderPlaintext(tokens))
      .then((requestParams) => {
        return btoa(requestParams.headers.authorization);
      });

    await openPage(`https://api.clever-cloud.com/v4/billing/organisations/${ownerId}/invoices/${invoiceToDownload.invoice_number}.pdf?authorization=${ownerAuth}`, { wait: false });
  }
  else {
    await openPage(`https://console.clever-cloud.com/organisations/${ownerId}/billing/invoices`, { wait: false });
  }
}
