#!/usr/bin/env sh

set -euo pipefail

uninstall_zsh_root() {
  echo "Removing bash completion script"
  rm "/usr/share/zsh/site-functions/_clever"
}

uninstall_bash_root() {
  echo "Removing zsh completion script"
  rm "/usr/share/bash-completion/completions/clever"
}

uninstall() {
  if which zsh >/dev/null 2>&1; then
    uninstall_zsh_root
  fi
  if which bash >/dev/null 2>&1; then
    uninstall_bash_root
  fi
}

main() {
  if [ "$(id -u)" -ne 0 ]; then
    echo "This program requires root privileges" >&2
    echo "Please run it as root or try either 'pkexec ${0}' or 'sudo ${0}'" >&2
    exit 1
  fi
  uninstall
}

main
