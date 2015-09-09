#!/usr/bin/env sh

uninstall_zsh_user() {
 local zsh_comp_dir="${HOME}"/.local/share/zsh/site-functions
 rm "${zsh_comp_dir}"/_clever || true
}

uninstall_zsh_root() {
 rm /usr/share/zsh/site-functions/_clever || true
}

uninstall_bash_root() {
 rm /usr/share/bash-completion/completions/clever || true
}

uninstall() {
 if [[ "$USER" = "root" ]]; then
  if which zsh &>/dev/null; then
    uninstall_zsh_root
  fi
  if which bash &>/dev/null; then
    uninstall_bash_root
  fi
 else
  if which zsh &>/dev/null; then
    uninstall_zsh_user
  fi
 fi
}

uninstall
