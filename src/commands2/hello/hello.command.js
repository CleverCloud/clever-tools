import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineFlag } from '../../lib/define-flag.js';
import { styleText } from '../../lib/style-text.js';

const greetings = {
  en: 'Hello',
  fr: 'Bonjour',
  es: 'Hola',
};

export const helloCommand = defineCommand({
  name: 'hello',
  description: 'Say hello to someone',
  flags: {
    upper: defineFlag({
      name: 'upper',
      schema: z.boolean().default(false),
      description: 'Print the greeting in uppercase',
    }),
    lang: defineFlag({
      name: 'lang',
      schema: z.enum(['en', 'fr', 'es']).default('en'),
      description: 'Language for the greeting (en, fr, es)',
      placeholder: 'lang',
    }),
  },
  args: [
    defineArgument({
      schema: z.string(),
      description: 'Name to greet',
      placeholder: 'name',
    }),
    defineArgument({
      schema: z.string().optional(),
      description: 'Last name to greet',
      placeholder: 'last-name',
    }),
  ],
  async handler(flags, name, lastName) {
    const fullName = lastName ? `${name} ${styleText('blue', lastName)}` : name;
    const greeting = `${greetings[flags.lang]}, ${fullName}!`;
    console.log(flags.upper ? greeting.toUpperCase() : greeting);
  },
});
