export function get(follow, exitOnDeploy) {
  if (follow) {
    if (exitOnDeploy === 'deploy-start') {
      throw new Error('The `follow` and `exit-on` set to "deploy-start" options are not compatible');
    }
    return 'never';
  }
  return exitOnDeploy;
}

// plotQuietWarning: If in quiet mode and exitStrategy set to never plot a warning to indicate that the command will end
export function plotQuietWarning(exitStrategy, quiet) {
  if (exitStrategy === 'never' && quiet) {
    Logger.println(
      styleText(
        ['bold', 'yellow'],
        'The "never" exit-on strategy is not compatible with the "quiet" mode, it will exit once the deployment ends',
      ),
    );
  }
}
