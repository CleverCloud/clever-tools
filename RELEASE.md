# clever-tools releases

## How is this project built, packaged and published on various repositories?

* Everything is managed by some GitHub action workflows
* There are 4 workflows
  * Build: test and build
  * Publish: publish packages to various targets.
  * Release: use `release-please` to maintain a release PR
  * Preview: handles previews when some event occurs on PR
* We kept the workflows to a minimum and put most of the build logic in several JavaScript files executed with node.js and prefixed with `job-`.
* The `job-*.js` scripts use some external binaries when it was easier (or when there was no strong JS based solution):
  * `tar`
  * `zip`
  * `git`
  * `npm`
  * `ssh-keyscan`
  * `fpm` (which is a ruby gem)
  * `docker`

### Build

The Build workflow is triggered on every commit on a branch associated with a PR. It is also run on any commit on the `master` branch.

It does the following:

#### Check commit messages

We use [CommitLint](https://github.com/conventional-changelog/commitlint) to enforce the commit messages format.
All commit messages must follow the [conventional commit](https://www.conventionalcommits.org) rules.
They will be used to generate the CHANGELOG.

#### Ensure code quality

We use [ESLint](https://eslint.org/) to enforce JS coding style and spot linting errors ASAP.

Run this locally step with:
```shell
npm run lint
```

Or with auto fix:
```shell
npm run lint:fix
```

#### Build binaries

This step does three things:

* Builds binaries for GNU/Linux, macOS and Windows using [pkg](https://github.com/vercel/pkg).
  This allows us to release a self-contained binary without having to worry about the inner node.js dependencies etc... and other implementation details of the project.
* Packages various types of archives
  * `.tar.gz` archive for GNU/Linux
  * `.tar.gz` archive for macOS
  * `.zip` archive for Windows
* Bundles for different needs:
  * `.deb` bundle for Debian/Ubuntu...
  * `.rpm` bundle for CentOS/Fedora...

Run this step locally with:
```shell
node scripts/job-build.js
```

> [!IMPORTANT]
> Required environment variables: `RPM_GPG_NAME`, `RPM_GPG_PRIVATE_KEY`, `RPM_GPG_PASS`

### Preview

This workflow handles preview creation and deletion.

* The creation is triggered when a PR is created or synchronized (a new commit occurs on the branch).
* The deletion is triggered when a PR is closed.

Previews are publish on [Cellar](https://www.clever-cloud.com/product/cellar-object-storage/).
When a preview is published for the first time, a comment with the right links is added to the PR.
When a preview is deleted, a comment is also added to the PR.

> [!NOTE]
> The Cellar instance ID is: `addon_d98a2f57-62cc-4b57-a71a-d8c1e8bc47ff`.

#### Preview management CLI

A CLI is here to help managing previews.

All commands have 2 arguments:
* First argument is the action: `get`, `list`, `build`, `publish`, `delete`
* Second argument is the branch: It can be omitted and will be the current branch by default.

> [!IMPORTANT]
> Required environment variables: `CC_CLEVER_TOOLS_PREVIEWS_CELLAR_KEY_ID`, `CC_CLEVER_TOOLS_PREVIEWS_CELLAR_SECRET_KEY`.

##### Examples:

Building a preview for the current branch:
```shell
./scripts/job-preview.js build
```

Publishing a preview for the current branch:
```shell
./scripts/job-preview.js publish
```

If a preview with the same name already exists, it will be overridden.

Getting the preview for the current branch:
```shell
./scripts/job-preview.js get
```

Listing all previews:
```shell
./scripts/job-preview.js list
```

Deleting a preview for the current branch:
```shell
./scripts/job-preview.js delete
```

### Release

The release workflow is triggered when a commit is pushed on the `master` branch or on `hotfix/*` branches.

This workflow uses [release-please](https://github.com/googleapis/release-please) GitHub action.

Basically, a GitHub Pull Request is maintained by this GitHub action.
This Pull Request contains the modification for the next release.
Merging the [release-please](https://github.com/googleapis/release-please) pull request will perform the release:

* Generation of the CHANGELOG.md
* Bump of the version number in the package.json
* Commit and add git tag

#### Hotfix

Standard releases are done on the `master` branch.
If you need a Hot fix release, you must do the modification on a branch using `hotfix/` prefix.
For instance, a branch named `hotfix/x.y.z` will have a dedicated release PR maintained by `release-please`.


### Publish

This workflow publishes the new version via different method depending on the target.
It is triggered when a new git tag is added.

#### Cellar

`.tar.gz`, `.zip`, `.deb` and `.rpm` (and corresponding `.sha256` files) are published on Clever Cloud's Cellar.

* We publish the files under `X.Y.Z` but also under `latest`.

> [!NOTE]
> The Cellar instance ID is: `addon_fc310359-fc4f-4e30-b37c-b34127c4bb75`.

> [!IMPORTANT]
> Required environment variables: `CC_CLEVER_TOOLS_RELEASES_CELLAR_KEY_ID`, `CC_CLEVER_TOOLS_RELEASES_CELLAR_SECRET_KEY`.


#### Nexus

`.deb`, `.nupkg` and `.rpm` are published on Clever Cloud's public Nexus instance.

* `.deb` are published on Nexus repo: [deb](https://nexus.clever-cloud.com/#browse/browse:deb).
* `.nupkg` are published on Nexus repo: [nupkg](https://nexus.clever-cloud.com/#browse/browse:nupkg).
* `.rpm` are published on Nexus repo: [rpm](https://nexus.clever-cloud.com/#browse/browse:rpm).

> [!IMPORTANT]
> Required environment variables: `NEXUS_PASSWORD`, `NEXUS_USER`, `NUGET_API_KEY`.

#### Archlinux

For Archlinux, a new commit is created and pushed to an AUR git repository: [clever-tools-bin](https://aur.archlinux.org/packages/clever-tools-bin/).

* The new commit updates all files of this repo using the templates in `templates/arch`.

> [!IMPORTANT]
> You need to have access to this repository using SSH key.

> [!NOTE]
> Note that our CI/CD has access to this repository using a GitHub secret.

#### Homebrew

For homebrew, a new commit is created and pushed to a GitHub repository: [homebrew-tap](https://github.com/CleverCloud/homebrew-tap).

* The new commit updates all files of the given repo using the templates in `templates/brew`.

> [!IMPORTANT]
> You need to have access to this repository using SSH key.

> [!NOTE]
> Note that our CI/CD has access to this repository using a GitHub secret.


#### npm

We publish new versions on [npmjs.org](https://www.npmjs.com/package/clever-tools) via `npm publish`.

> [!IMPORTANT]
> Required environment variables: `NPM_TOKEN`.

> [!NOTE]
> This `NPM_TOKEN` is generated from the `clevercloud-ci` account.

#### Docker Hub

For Docker Hub, a new commit is created and pushed to a GitHub repository: [clever-tools-dockerhub](https://github.com/CleverCloud/clever-tools-dockerhub).

* The new commit updates all files of the given repo using the templates in `templates/dockerhub`.

Then, we build the docker image and publish it on [Docker Hub](https://hub.docker.com/r/clevercloud/clever-tools/).

> [!IMPORTANT]
> Required environment variables: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`.
> You need to have access to this repository using an SSH key.

> [!NOTE]
> Note that our CI/CD has access to this repository using a GitHub secret.

#### Publish locally

All publication is done automatically with a GitHub action.
However, you may need to publish things manually.
The `scripts/job-publish.sh` comes to the rescue:

Usage: `scripts/job-publish.sh {VERSION} {[...TARGETS]?}`

* `VERSION` must be a valid semver version
* `VERSION` must be the same as the version specified in the package.json. (Make sur you run `npm version` before.)
* `TARGETS` is optional: if omitted the script will publish on every target.
* `TARGETS` is one of: `cellar, arch, brew, dockerhub, exherbo, nexus, npm`

> [!NOTE]
> You'll need to set up the env vars required by the targets you specified in the command (see above).
> Env var containing the Cellar credentials will still be required (even if the `cellar` target is not requested).
> This is because the script ensures that all the files are present on Cellar before doing any publication on other targets.

##### Examples:

Full release process:

```shell
VERSION="X.Y.Z"

# create new version
npm version $VERSION

# git commit and tag
git add --all
git commit -m "Release $VERSION"
git tag $VERSION
git push --tags

# build
node scripts/job-build.js $VERSION --latest --bundle

# publish
node scripts/job-publish.js $VERSION
```

Publish only some targets:

```shell
node scripts/job-publish.js $VERSION arch brew
```

> [!NOTE]
> As the `cellar` target is not required here, the script will verify that all the files are present in cellar before publishing `arch` and `brew` targets.
