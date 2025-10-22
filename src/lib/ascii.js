import { styleText } from './style-text.js';

const LOGO = styleText(
  'green',
  `
 ██████╗██╗     ███████╗██╗   ██╗███████╗██████╗     ██╗  ██╗ █████╗ ███████╗
██╔════╝██║     ██╔════╝██║   ██║██╔════╝██╔══██╗    ██║ ██╔╝██╔══██╗██╔════╝
██║     ██║     █████╗  ██║   ██║█████╗  ██████╔╝    █████╔╝ ╚█████╔╝███████╗
██║     ██║     ██╔══╝  ╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██╔═██╗ ██╔══██╗╚════██║
╚██████╗███████╗███████╗ ╚████╔╝ ███████╗██║  ██║    ██║  ██╗╚█████╔╝███████║
 ╚═════╝╚══════╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚═╝  ╚═╝ ╚════╝ ╚══════╝

 Your Clever Cloud Kubernetes cluster has been successfully created, it's now starting up!

 It will take about 1 minute. To manage it, use the following commands:
   - clever k8s list                                  List your Kubernetes clusters
   - clever k8s get <cluster-id-or-name>              Get information about a specific cluster
   - clever k8s get-kubeconfig <cluster-id-or-name>   Get the kubeconfig file for your cluster
   - clever k8s delete <cluster-id-or-name>           Delete a specific cluster

 Learn more about commands with 'clever k8s --help'

 For more information, read the documentation https://www.clever.cloud/developers/doc/kubernetes/

 Enjoy!
`,
);

// const clearScreen = () => process.stdout.write('\x1B[2J\x1B[0f');
const hideCursor = () => process.stdout.write('\x1B[?25l');
const showCursor = () => process.stdout.write('\x1B[?25h');
const sleep = (ms = 42) => new Promise((resolve) => setTimeout(resolve, ms));

export async function typewriterLogo() {
  hideCursor();

  const lines = LOGO.split('\n');

  for (const line of lines) {
    for (const char of line) {
      process.stdout.write(char);
      await sleep();
    }
    console.log();
  }

  showCursor();
}
