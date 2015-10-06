#!/usr/bin/env sh

set -euo pipefail

install_bash_root() {
  local us="${1}"

  echo "Installing bash completion script"
  clever --bash-autocomplete-script "${us}" > "/usr/share/bash-completion/completions/clever"
}

install_zsh_root() {
  local us="${1}"

  echo "Installing zsh completion script"
  clever --zsh-autocomplete-script "${us}" > "/usr/share/zsh/site-functions/_clever"
}

install() {
  local us

  us="$(which clever)"

  if which bash >/dev/null 2>&1; then
    install_bash_root "${us}"
  fi
  if which zsh >/dev/null 2>&1; then
    install_zsh_root "${us}"
  fi

  cat <<"EOF"
You can uninstall completion scripts at any time by running uninstall-clever-completion
EOF
}

main() {
    if [ "$(id -u)" -ne 0 ]; then
        echo "This program requires root privileges" >&2
        echo "Please run it as root or try either 'pkexec ${0}' or 'sudo ${0}'" >&2
        exit 1
    fi
    install
}

main
