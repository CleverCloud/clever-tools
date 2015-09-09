#!/usr/bin/env sh

install_bash_user() {
 local us="${1}"

 clever --bash-autocomplete-script "${us}" >> "${HOME}"/.bash_completion
}

install_zsh_user() {
 local us="${1}"
 local zsh_comp_dir="${HOME}"/.local/share/zsh/site-functions

 mkdir -p "${zsh_comp_dir}"
 clever --zsh-autocomplete-script "${us}" >> "${zsh_comp_dir}"/_clever
 if zsh -c '! [[ -n "${fpath[(r)'"${zsh_comp_dir}"']}" ]]'; then
   echo 'Adding ~/.local/share/zsh/site-functions to $fpath'
   echo 'fpath=('"${zsh_comp_dir}"' $fpath)' >> "${HOME}"/.zshrc
 fi
}

install_bash_root() {
 local us="${1}"

 clever --bash-autocomplete-script "${us}" >> /usr/share/bash-completion/completions/clever
}

install_zsh_root() {
 local us="${1}"

 clever --zsh-autocomplete-script "${us}" >> /usr/share/zsh/site-functions/_clever
}

install() {
 local us="$(which clever)"

 if [[ "$USER" = "root" ]]; then
   if which bash &>/dev/null; then
     install_bash_root "${us}"
   fi
   if which zsh &>/dev/null; then
     install_zsh_root "${us}"
   fi
 else
   if which bash &>/dev/null; then
     install_bash_user "${us}"
   fi
   if which zsh &>/dev/null; then
     install_zsh_user "${us}"
   fi
 fi
}

install
