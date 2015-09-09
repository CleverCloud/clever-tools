#!/usr/bin/env sh

uninstall_zsh() {
 local zsh_comp_dir="${HOME}"/.local/share/zsh/site-functions
 rm "${zsh_comp_dir}"/_clever || true
}

uninstall() {
 if which zsh &>/dev/null; then
   uninstall_zsh
 fi
}

uninstall
