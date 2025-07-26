import { Logger } from '../logger.js';
import pkg from '../../package.json' with { type: 'json' };

export async function version () {
  Logger.println(pkg.version);
}
