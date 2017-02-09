#!/usr/bin/env node

console.log("To enable autocompletion automatically, run 'install-clever-completion'");
console.log();
console.log("If you want to install completion manually (requires root privileges):");
console.log();
console.log("    clever --bash-autocomplete-script \"$(which clever)\" > /usr/share/bash-completion/completions/clever");
console.log("    clever --zsh-autocomplete-script \"$(which clever)\" > /usr/share/zsh/site-functions/_clever");
console.log();
console.log("You can uninstall autocompletion at any moment by running 'uninstall-clever-completion'");
