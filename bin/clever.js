#!/usr/bin/env node

// WARNING: this needs to run before other imports
import '../src/initial-setup.js';
import '../src/initial-update-notifier.js';
// Other imports
import pkg from '../package.json' with { type: 'json' };
import { globalCommands, loadAllCommands } from '../src/commands/global.commands.js';
import { commandsMetadata } from '../src/commands/global.commands.metadata.js';
import {
  colorOption,
  helpOption,
  updateNotifierOption,
  verboseOption,
  versionOption,
} from '../src/commands/global.options.js';
import { EXPERIMENTAL_FEATURES, getFeatures } from '../src/config/features.js';
import { cliparse } from '../src/lib/cliparse-patched.js';
import { styleText } from '../src/lib/style-text.js';
import { getDefault, getEnumValues, isBoolean, isRequired } from '../src/lib/zod-utils.js';

/**
 * @typedef {import('../src/lib/define-command.types.js').CommandDefinition} CommandDefinition
 * @typedef {import('../src/lib/define-option.types.js').OptionDefinition} OptionDefinition
 * @typedef {import('../src/lib/define-argument.types.js').ArgumentDefinition} ArgumentDefinition
 * @typedef {import('../src/commands/global.commands.js').CommandTreeEntry} LazyTreeEntry
 */

// Boolean global flags we recognise during argv preflight. When other options
// are seen, we conservatively assume they consume the next token.
const KNOWN_BOOLEAN_FLAGS = new Set([
  '--help',
  '-?',
  '-h',
  '--version',
  '-V',
  '--verbose',
  '-v',
  '--color',
  '--no-color',
  '--update-notifier',
  '--no-update-notifier',
  '--quiet',
  '-q',
]);

// Exit cleanly if the program we pipe to exits abruptly
process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') {
    process.exit(0);
  }
});

// Right now, this is the only way to do this properly
// cliparse doesn't allow unknown options/arguments
if (process.argv[2] === 'curl') {
  curlBypass().catch(() => process.exit(1));
} else {
  run().catch(() => process.exit(1));
}

async function curlBypass() {
  const { curl } = await import('../src/commands/curl/curl.command.js');
  return curl();
}

async function run() {
  /** @type {Record<string, boolean>} */
  const featuresFromConf = await getFeatures();
  const argv = process.argv.slice(2);

  // Autocomplete walks the entire tree (including option `complete` callbacks
  // on every command); fall back to the eager build path.
  if (argv.some((a) => a.startsWith('--autocomplete-words') || a.startsWith('--autocomplete-index'))) {
    return runEager(featuresFromConf);
  }

  // Argv preflight: figure out which command chain (if any) was invoked,
  // so we only load that chain's modules.
  const matchedChain = preflight(argv, globalCommands);

  // Eager-load matched chain so cliparse has full options/args/handler.
  const loaded = await loadChain(matchedChain);

  const commands = buildCommandTree(globalCommands, [], featuresFromConf, loaded);
  startCliparse(commands, featuresFromConf);
}

/**
 * Fallback: load every command (today's behaviour) and run cliparse with the
 * fully-resolved tree. Used for autocomplete and for the defensive stub action.
 * @param {Record<string, boolean>} featuresFromConf
 */
async function runEager(featuresFromConf) {
  const resolved = await loadAllCommands();
  const commands = buildEagerTree(resolved, [], featuresFromConf);
  startCliparse(commands, featuresFromConf);
}

/**
 * Walk argv to detect the matched command chain. Skips global options and
 * heuristically skips one or two tokens per other option (depending on whether
 * the option is a known boolean flag).
 * @param {string[]} argv
 * @param {Record<string, LazyTreeEntry>} tree
 * @returns {Array<{ name: string, dottedPath: string, lazy: { loader: () => Promise<CommandDefinition> } }>}
 */
function preflight(argv, tree) {
  const positional = [];
  let i = 0;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok === '--') {
      positional.push(...argv.slice(i + 1));
      break;
    }
    if (tok.startsWith('-')) {
      const name = tok.includes('=') ? tok.slice(0, tok.indexOf('=')) : tok;
      const isInline = tok.includes('=');
      if (isInline || KNOWN_BOOLEAN_FLAGS.has(name)) {
        i += 1;
      } else {
        i += 2;
      }
      continue;
    }
    positional.push(tok);
    i += 1;
  }

  // `clever help <cmd>` — load the same chain as `<cmd> --help`.
  let startIdx = 0;
  if (positional[0] === 'help') {
    startIdx = 1;
  }

  const chain = [];
  let cursor = tree;
  for (let j = startIdx; j < positional.length; j++) {
    const name = positional[j];
    const entry = cursor[name];
    if (entry == null) break;
    const lazyEntry = Array.isArray(entry) ? entry[0] : entry;
    chain.push({
      name,
      dottedPath: chain
        .map((c) => c.name)
        .concat(name)
        .join('.'),
      lazy: lazyEntry,
    });
    if (Array.isArray(entry)) {
      cursor = entry[1];
    } else {
      break;
    }
  }
  return chain;
}

/** @returns {Promise<Map<string, CommandDefinition>>} */
async function loadChain(chain) {
  const loaded = new Map();
  await Promise.all(
    chain.map(async (link) => {
      const def = await link.lazy.loader();
      loaded.set(link.dottedPath, def);
    }),
  );
  return loaded;
}

/**
 * Build cliparse commands from the lazy tree. Loaded commands receive their
 * full options/args/handler; everything else is a stub with metadata-only
 * description plus a defensive lazy-fallback action.
 * @param {Record<string, LazyTreeEntry>} tree
 * @param {string[]} prefix
 * @param {Record<string, boolean>} featuresFromConf
 * @param {Map<string, CommandDefinition>} loaded
 */
function buildCommandTree(tree, prefix, featuresFromConf, loaded) {
  const out = [];
  for (const [name, entry] of Object.entries(tree)) {
    const dottedPath = [...prefix, name].join('.');
    const meta = commandsMetadata[dottedPath];
    if (meta?.featureFlag != null && !featuresFromConf[meta.featureFlag]) continue;

    let lazyEntry;
    let sub = {};
    if (Array.isArray(entry)) {
      [lazyEntry, sub] = entry;
    } else {
      lazyEntry = entry;
    }

    const subcommands = buildCommandTree(sub, [...prefix, name], featuresFromConf, loaded);
    const loadedDef = loaded.get(dottedPath);

    if (loadedDef != null) {
      out.push(buildLoadedCommand(name, loadedDef, meta, subcommands));
    } else {
      out.push(buildStubCommand(name, lazyEntry, meta, subcommands, featuresFromConf));
    }
  }
  return out;
}

/**
 * Build cliparse commands from the fully-resolved tree (eager fallback).
 * @param {Record<string, CommandDefinition | [CommandDefinition, Record<string, unknown>]>} tree
 * @param {string[]} prefix
 * @param {Record<string, boolean>} featuresFromConf
 */
function buildEagerTree(tree, prefix, featuresFromConf) {
  const out = [];
  for (const [name, entry] of Object.entries(tree)) {
    const dottedPath = [...prefix, name].join('.');
    const meta = commandsMetadata[dottedPath];
    if (meta?.featureFlag != null && !featuresFromConf[meta.featureFlag]) continue;

    let def;
    let sub = {};
    if (Array.isArray(entry)) {
      [def, sub] = entry;
    } else {
      def = entry;
    }
    const subcommands = buildEagerTree(sub, [...prefix, name], featuresFromConf);
    out.push(buildLoadedCommand(name, def, meta, subcommands));
  }
  return out;
}

function buildLoadedCommand(name, commandDef, meta, subcommands) {
  const command = convertCommand(name, commandDef, subcommands);
  if (meta?.isExperimental && meta?.featureFlag != null) {
    const featureInfo = EXPERIMENTAL_FEATURES[meta.featureFlag];
    if (featureInfo != null) {
      command.description = styleText('yellow', command.description + ' [' + featureInfo.status.toUpperCase() + ']');
    }
  }
  return command;
}

/**
 * Stub command for the not-yet-loaded entries. cliparse only needs the
 * description for sibling-listing in help output. If the action ever fires
 * (preflight miss), we fall back to the eager build.
 */
function buildStubCommand(name, lazyEntry, meta, subcommands, featuresFromConf) {
  let description = meta?.description ?? '';
  if (meta?.isExperimental && meta?.featureFlag != null) {
    const featureInfo = EXPERIMENTAL_FEATURES[meta.featureFlag];
    if (featureInfo != null) {
      description = styleText('yellow', description + ' [' + featureInfo.status.toUpperCase() + ']');
    }
  }

  const cliparseConfig = { description };
  if (subcommands.length > 0) {
    cliparseConfig.commands = subcommands;
  }

  const fallbackAction = async () => {
    // Preflight didn't match this command but cliparse routed to it anyway —
    // load the full tree and re-run.
    await runEager(featuresFromConf);
  };

  // For stub commands, register no options/args; cliparse will surface unknown
  // options via its usual error path. The fallback action only fires when
  // cliparse believes parsing succeeded against the (empty) stub spec.
  const command = cliparse.command(name, cliparseConfig, fallbackAction);
  // No _definition is attached; if cliparse-patched's help is invoked for a
  // stub it falls back to cliparse's built-in help (still readable).
  return command;
}

function startCliparse(commands, _featuresFromConf) {
  const rootCommandDefinition = {
    description: "CLI tool to manage Clever Cloud's data and products",
    options: {
      help: helpOption,
      version: versionOption,
      verbose: verboseOption,
      color: colorOption,
      'update-notifier': updateNotifierOption,
    },
  };

  const sortedCommands = commands.sort((a, b) => a.name.localeCompare(b.name));

  const cliParser = cliparse.cli({
    name: 'clever',
    description: rootCommandDefinition.description,
    version: pkg.version,
    options: [convertOption(colorOption), convertOption(updateNotifierOption), convertOption(verboseOption)],
    helpCommand: false,
    commands: sortedCommands,
  });

  // Attach root definition so cliparse-patched.js can use it for --help display
  cliParser._definition = rootCommandDefinition;

  // Make sure argv[0] is always "node"
  const cliArgs = process.argv;
  cliArgs[0] = 'node';
  cliparse.parse(cliParser, cliArgs);
}

/**
 * Convert a command definition to cliparse format
 * @param {string} name - Command name
 * @param {CommandDefinition} commandDef - Command definition object
 * @param {Object[]} subcommands - Array of cliparse subcommands
 * @returns {Object} cliparse command
 */
function convertCommand(name, commandDef, subcommands = []) {
  const cliparseConfig = {
    description: commandDef.description,
  };

  if (commandDef.options != null) {
    cliparseConfig.privateOptions = Object.values(commandDef.options).map(convertOption);
  }

  // Convert arguments
  if (commandDef.args != null && commandDef.args.length > 0) {
    cliparseConfig.args = commandDef.args.map(convertArgument);
  }

  // Add subcommands
  if (subcommands.length > 0) {
    cliparseConfig.commands = subcommands;
  }

  const command = cliparse.command(name, cliparseConfig, commandDef.handler);

  // Attach the original definition so cliparse-patched.js can use it for --help display
  command._definition = commandDef;

  return command;
}

/**
 * Convert an option definition to cliparse format
 * @param {OptionDefinition} option - Option definition from global.options.js
 * @returns {Object} cliparse option
 */
function convertOption(option) {
  const cliparseConfig = {
    description: option.description,
  };

  if (option.aliases != null) {
    cliparseConfig.aliases = option.aliases;
  }
  const optionDefault = getDefault(option.schema);
  if (optionDefault != null) {
    // Parse the default value through the schema to apply transforms
    const parsed = option.schema.safeParse(optionDefault);
    cliparseConfig.default = parsed.success ? parsed.data : optionDefault;
  }
  if (option.placeholder != null) {
    cliparseConfig.metavar = option.placeholder;
  }
  if (option.complete != null) {
    cliparseConfig.complete = option.complete;
  } else {
    const enumValues = getEnumValues(option.schema);
    if (enumValues != null) {
      cliparseConfig.complete = enumValues;
    }
  }

  // Use Zod's safeParse for validation (handles coercion, enums, refinements, etc.)
  cliparseConfig.parser = (value) => {
    // Log deprecation warning if option is deprecated
    if (option.deprecated) {
      const message = typeof option.deprecated === 'string' ? `, ${option.deprecated}.` : '';
      console.error(styleText('yellow', `Warning: --${option.name} is deprecated${message}`));
    }

    const result = option.schema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(', '));
    }
    return result.data;
  };

  // Mark as required if schema has no default and is not optional
  if (isRequired(option.schema)) {
    cliparseConfig.required = true;
  }

  // Boolean schemas: use cliparse.option with expects_value: false (like cliparse.flag does)
  if (isBoolean(option.schema)) {
    // eslint-disable-next-line camelcase -- cliparse API uses snake_case
    cliparseConfig.expects_value = false;
  }

  return cliparse.option(option.name, cliparseConfig);
}

/**
 * Convert an argument definition to cliparse format
 * @param {ArgumentDefinition} arg - Argument definition
 * @returns {Object} cliparse argument
 */
function convertArgument(arg) {
  const cliparseConfig = {
    description: arg.description,
  };

  if (arg.complete) {
    cliparseConfig.complete = arg.complete;
  } else {
    const enumValues = getEnumValues(arg.schema);
    if (enumValues != null) {
      cliparseConfig.complete = enumValues;
    }
  }

  // Use Zod's safeParse for validation (handles coercion, enums, refinements, etc.)
  cliparseConfig.parser = (value) => {
    const result = arg.schema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues.map((i) => i.message).join(', '));
    }
    return result.data;
  };

  const argDefault = getDefault(arg.schema);
  if (argDefault != null) {
    // Parse the default value through the schema to apply transforms
    const parsed = arg.schema.safeParse(argDefault);
    cliparseConfig.default = parsed.success ? parsed.data : argDefault;
  } else if (!isRequired(arg.schema)) {
    cliparseConfig.default = '';
  }

  return cliparse.argument(arg.placeholder, cliparseConfig);
}
