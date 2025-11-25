import { ngValidType as ngValidTypeParser } from '../../parsers.js';

export const ngResourceTypeOpt = {
  name: 'type',
  description: 'Type of resource to look for (NetworkGroup, Member, CleverPeer, ExternalPeer)',
  type: 'option',
  metavar: 'type',
  aliases: null,
  default: null,
  required: null,
  parser: ngValidTypeParser,
  complete: null
};

