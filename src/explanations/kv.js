import colors from 'colors/safe.js';

export default `
${colors.blue.bold('KV COMMAND')}
Send raw commands to Materia KV or Redis® add-ons.
${colors.gray('Allows direct interaction with your key-value store using native Redis commands.')}

${colors.yellow.bold('USAGE EXAMPLES:')}

${colors.cyan('# Basic key operations')}
${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID INCR myCounter')}
(integer) 1

${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID SET myKey myValue')}
OK

${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID GET myKey')}
myValue

${colors.cyan('# Key expiration')}
${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID SET myKey myValue EX 120')}
OK

${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID TTL myKey')}
(integer) 118

${colors.cyan('# Working with JSON data')}
${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID SET myJsonKey \'{"user": "john", "age": 30}\'')}
OK

${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID GET myJsonKey | jq .user')}
"john"

${colors.cyan('# Using JSON format output')}
${colors.gray('$')} ${colors.green('clever kv ADDON_NAME_OR_ID SCAN 0 -F json | jq \'.[1][0]\'')}
"myKey"

${colors.yellow.bold('💡 TIPS:')}
• Get all supported commands: ${colors.green('clever kv ADDON_NAME_OR_ID COMMANDS')}
• Use ${colors.green('-F json')} for structured output that works well with ${colors.green('jq')}
• Redis commands are case-insensitive but uppercase is conventional
• Complex values should be JSON-stringified for better parsing

${colors.yellow.bold('⚠️  NOTES:')}
• This feature is in ALPHA - syntax may change in future versions
• Commands are sent directly to Redis - be careful with destructive operations
• Large result sets might be truncated - use pagination commands like SCAN
• Some Redis modules commands might not be available depending on your plan

${colors.yellow.bold('📚 DOCUMENTATION LINKS:')}
• https://www.clever-cloud.com/developers/doc/cli/kv-stores/
• https://www.clever-cloud.com/developers/doc/cli/kv-stores/index.html.md`;
