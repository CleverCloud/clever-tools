#!/usr/bin/env bash

set -euo pipefail

install_bash_root() {
  local wrapper="${1}"
  local us="${2}"
  local compdir="/usr/share/bash-completion/completions"

  if [ $(uname) == "Darwin" ]; then
    compdir="/usr/local/share/bash-completion/completions"
  fi

  echo "Installing bash completion script"
  "${wrapper}" mkdir -p "${compdir}"
  clever --bash-autocomplete-script "${us}" | "${wrapper}" tee "${compdir}"/clever >/dev/null
}

install_zsh_root() {
  local wrapper="${1}"
  local us="${2}"
  local compdir="/usr/share/zsh/site-functions"

  if [ $(uname) == "Darwin" ]; then
    compdir="/usr/local/share/zsh/site-functions"
  fi

  echo "Installing zsh completion script"
  "${wrapper}" mkdir -p "${compdir}"
  clever --zsh-autocomplete-script "${us}" | "${wrapper}" tee "${compdir}"/_clever >/dev/null
}

install() {
  local wrapper="${1}"
  local us

  us="$(which clever)"

  if which bash >/dev/null 2>&1; then
    install_bash_root "${wrapper}" "${us}"
  fi
  if which zsh >/dev/null 2>&1; then
    install_zsh_root "${wrapper}" "${us}"
  fi

  cat <<"EOF"
You can uninstall completion scripts at any time by running uninstall-clever-completion
EOF
}

main() {
  local wrapper
  local wrappers=( pkexec sudo )

  for w in "${wrappers[@]}"; do
    wrapper="$(which "${w}" 2>/dev/null || true)"
    [ "x${wrapper}" != "x" ] && break
  done

  if [ "x${wrapper}" == "x" ]; then
    echo "This program requires root privileges and neither of \"${wrappers[@]}\" is installed" >&2
    echo "Please run it as root" >&2
    exit 1
  fi

  install "${wrapper}"
}

main
