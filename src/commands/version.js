import pkg from '../../package.json' with { type: 'json' };
import { Logger } from '../logger.js';

export async function version() {
  Logger.println(pkg.version);
}
