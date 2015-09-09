#!/usr/bin/env sh

install_bash() {
 local us="${1}"

 clever --bash-autocomplete-script "${us}" >> "${HOME}"/.bash_completion
}

install_zsh() {
 local us="${1}"
 local zsh_comp_dir="${HOME}"/.local/share/zsh/site-functions

 mkdir -p "${zsh_comp_dir}"
 clever --zsh-autocomplete-script "${us}" >> "${zsh_comp_dir}"/_clever
 if zsh -c '! [[ -n "${fpath[(r)'"${zsh_comp_dir}"']}" ]]'; then
   echo 'Adding ~/.local/share/zsh/site-functions to $fpath'
   echo 'fpath=('"${zsh_comp_dir}"' $fpath)' >> "${HOME}"/.zshrc
 fi
}

install() {
 local us="$(which clever)"

 if which bash &>/dev/null; then
   install_bash "${us}"
 fi
 if which zsh &>/dev/null; then
   install_zsh "${us}"
 fi
}

install
