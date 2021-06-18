#!/usr/bin/env bash

set -euo pipefail

GIT_TAG="$(echo -e "${GIT_TAG_NAME}" | tr -d '[:space:]')"

curl -u "ci:$NEXUS_PASSWORD" --upload-file ./releases/$GIT_TAG/clever-tools-$GIT_TAG.rpm https://nexus.clever-cloud.com/repository/rpm/
curl -u "ci:$NEXUS_PASSWORD"  -H "Content-Type: multipart/form-data" --data-binary "@./releases/$GIT_TAG/clever-tools-$GIT_TAG.deb" "https://nexus.clever-cloud.com/repository/deb/"
curl -u "ci:$NEXUS_PASSWORD"  -X PUT -H "X-NuGet-ApiKey: $NUGET_API_KEY" -F "data=@./releases/$GIT_TAG/clever-tools.$GIT_TAG.nupkg" https://nexus.clever-cloud.com/repository/nuget/