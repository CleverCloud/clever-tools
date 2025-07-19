import colors from 'colors/safe.js';

export default `
${colors.blue.bold('VERSION COMMAND')}
Displays the current version of the Clever Tools CLI.
${colors.gray('Useful for troubleshooting, checking compatibility, and reporting issues.')}

${colors.yellow.bold('USAGE EXAMPLES:')}

${colors.cyan('# Basic version check')}
${colors.gray('$')} ${colors.green('clever version')}
3.13.1

${colors.cyan('# Check version in CI/CD scripts')}
${colors.gray('$')} ${colors.green('if clever version | grep -q "3.13"; then echo "Compatible"; fi')}
Compatible

${colors.cyan('# Store version in variable')}
${colors.gray('$')} ${colors.green('VERSION=$(clever version)')}
${colors.gray('$')} ${colors.green('echo "Using Clever Tools v$VERSION"')}
Using Clever Tools v3.13.1

${colors.yellow.bold('💡 TIPS:')}
• Use this command to verify your CLI installation
• Include version output when reporting bugs or issues
• Version follows semantic versioning (MAJOR.MINOR.PATCH)
• No network connection required - reads from local installation

${colors.yellow.bold('💬 NOTES:')}
• This command never fails and always returns exit code 0
• Output is always a single line with the version number
• No configuration or authentication required

${colors.yellow.bold('📚 DOCUMENTATION LINKS:')}
• https://www.clever-cloud.com/developers/doc/cli/install/
• https://www.clever-cloud.com/developers/doc/cli/install/index.html.md`;
