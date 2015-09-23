#!/usr/bin/env sh

uninstall_zsh_root() {
  echo "Removing bash completion script"
  sudo 'rm /usr/share/zsh/site-functions/_clever'
}

uninstall_bash_root() {
  echo "Removing zsh completion script"
  sudo 'rm /usr/share/bash-completion/completions/clever'
}

uninstall() {
  if which zsh &>/dev/null; then
    uninstall_zsh_root
  fi
  if which bash &>/dev/null; then
    uninstall_bash_root
  fi
}

uninstall
