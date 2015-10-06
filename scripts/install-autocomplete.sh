#!/usr/bin/env sh

set -euo pipefail

install_bash_root() {
  local us="${1}"
  local compdir="/usr/share/bash-completion/completions"

  echo "Installing bash completion script"
  mkdir -p "${compdir}"
  clever --bash-autocomplete-script "${us}" > "${compdir}"/clever
}

install_zsh_root() {
  local us="${1}"
  local compdir="/usr/share/zsh/site-functions"

  echo "Installing zsh completion script"
  mkdir -p "${compdir}"
  clever --zsh-autocomplete-script "${us}" > "${compdir}"/_clever
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
