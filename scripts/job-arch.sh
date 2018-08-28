#!/usr/bin/env bash

set -euo pipefail

rm -rf git-arch
git clone ssh://aur@aur.archlinux.org/clever-tools-bin.git git-arch
cd git-arch

SHA256=$(cat releases/${GIT_TAG_NAME}/clever-tools-${GIT_TAG_NAME}_macos.tar.gz.sha256)
echo $GIT_TAG_NAME
echo $SHA256

sed -r "s/@VERSION@/$GIT_TAG_NAME/g;s/@SHA256@/$SHA256/g" PKGBUILD.template > PKGBUILD
sed -r "s/@VERSION@/$GIT_TAG_NAME/g;s/@SHA256@/$SHA256/g" .SRCINFO.template > .SRCINFO

git add PKGBUILD .SRCINFO
git commit -m "Update to ${GIT_TAG_NAME}"

cat PKGBUILD
cat .SRCINFO
git log

#git push origin master
