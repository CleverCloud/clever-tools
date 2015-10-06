#!/usr/bin/env sh

set -euo pipefail

cat << EOF
To enable autocompletion automatically, run 'install-clever-completion'

If you want to install completion manually (requires root privileges):

    clever --bash-autocomplete-script "\$(which clever)" > /usr/share/bash-completion/completions/clever
    clever --zsh-autocomplete-script "\$(which clever)" > /usr/share/zsh/site-functions/_clever

You can uninstall autocompletion at any moment by running 'uninstall-clever-completion'
EOF
