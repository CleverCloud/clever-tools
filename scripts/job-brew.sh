#!/usr/bin/env bash

set -euo pipefail

mkdir -p ~/.ssh
ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts
git config --global user.email "$GIT_USER_EMAIL"
git config --global user.name "$GIT_USER_NAME"

git clone git@github.com:CleverCloud/homebrew-tap.git git-brew
cd git-brew

SHA256=$(cat releases/${GIT_TAG_NAME}/clever-tools-${GIT_TAG_NAME_linux}.tar.gz.sha256)

cat clever-tools.template.rb \
    | sed "s/@VERSION@/$GIT_TAG_NAME/g" \
    | sed "s/@SHA256@/$SHA256/g" \
    > Formula/clever-tools.rb

git add Formula/clever-tools.rb
git commit -m "clever-tools: ${GIT_TAG_NAME} release"

cat Formula/clever-tools.rb
git log

#git push origin master
