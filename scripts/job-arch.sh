#!/usr/bin/env bash

set -euo pipefail

mkdir -p ~/.ssh
ssh-keyscan -t rsa aur.archlinux.org >> ~/.ssh/known_hosts

git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

git clone ssh://aur@aur.archlinux.org/clever-tools-bin.git git-arch

cd git-arch
git ls-files -z | xargs -0 rm -f

node ../

git add *
git commit -m "Update to ${GIT_TAG_NAME}"

cat PKGBUILD
cat .SRCINFO
git log

#git push origin master
