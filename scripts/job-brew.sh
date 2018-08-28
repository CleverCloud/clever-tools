#!/usr/bin/env bash

set -euo pipefail

rm -rf git-brew
git clone git@github.com:CleverCloud/homebrew-tap.git
cd git-brew

SHA256=$(cat releases/${GIT_TAG_NAME}/clever-tools-${GIT_TAG_NAME_linux}.tar.gz.sha256)
echo $GIT_TAG_NAME
echo $SHA256

sed -r "s/@VERSION@/$GIT_TAG_NAME/g;s/@SHA256@/$SHA256/g" clever-tools.template.rb > Formula/clever-tools.rb

git add Formula/clever-tools.rb
git commit -m "clever-tools: ${GIT_TAG_NAME} release"

cat Formula/clever-tools.rb
git log

#git push origin master
