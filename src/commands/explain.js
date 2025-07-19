import { Logger } from '../logger.js';

const explanationCache = new Map();

async function loadExplanation (command) {
  if (explanationCache.has(command)) {
    return explanationCache.get(command);
  }

  try {
    const module = await import(`../explanations/${command}.js`);
    const explanation = module.default;
    explanationCache.set(command, explanation);
    return explanation;
  }
  catch (error) {
    Logger.printErrorLine(`Error while loading explanation for ${command}:`, error);
    return null;
  }
}

export async function explain (params) {
  const [command] = params.args;

  const explanation = await loadExplanation(command);
  if (explanation) {
    Logger.println(explanation);
  }
}
