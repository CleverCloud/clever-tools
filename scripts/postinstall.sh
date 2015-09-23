#!/usr/bin/env sh

cat <<"EOF"
To enable autocompletion, run 'install-clever-completion' (needs sudo)
If you don't have sudo or want to install completion manually,

    clever --bash-autocomplete-script '$(which clever)' > /usr/share/bash-completion/completions/clever
    clever --zsh-autocomplete-script '$(which clever)' > /usr/share/zsh/site-functions/_clever

You can uninstall autocompletion at any moment by running 'uninstall-clever-completion'
EOF
