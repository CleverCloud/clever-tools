# clever-tools releases

## How is this project built, packaged and published on various repositories?

* Everything is managed by a [multi-branch pipeline job in our Jenkins](https://ki2zrw1f1h-jenkins.services.clever-cloud.com/blue/organizations/jenkins/clever-tools/activity).
* The job consists of 3 steps which are configured in the `Jenkinsfile`: **build**, **package** and **publish**.
* We kept the `Jenkinsfile` to a minimum and put most of the build logic in several JavaScript files executed with node.js and prefixed with `job-`.
* The `job-*.js` scripts use some external binaries when it was easier (or when there was no strong JS based solution):
  * `tar`
  * `zip`
  * `git`
  * `npm`
  * `ssh-keyscan`
  * `fpm` (which is a ruby gem)
* We run this Jenkins job on an agent using this Docker image: [clever-tools-builder](https://hub.docker.com/r/clevercloud/clever-tools-builder/).
* The `Dockerfile` to build this image is here: [docker-runner/Dockerfile](./docker-runner/Dockerfile)
* The job is triggered on each new commit and each new tag via a classic Jenkins git hook setup in the GitHub project.
  * If it's a commit in a branch, we only run the **build** and **package** steps and we archive artefacts afterwards.
  * If it's a commit in a tag, we run the **build**, **package** AND **publish** steps.
  * The version in the **publish** step uses the git tag.

### Build

The first step of the job builds binaries for GNU/Linux, MacOS and Windows using [pkg](https://github.com/zeit/pkg).
This allows us to release a self-contained binary without having to worry about the inner node.js dependencies etc... and other implementation details of the project. 

### Package

The second step of the job packages various types of archives and bundles for different needs and computes SHA 256 sums:

* `.tar.gz` archive for GNU/Linux
* `.tar.gz` archive for MacOS
* `.zip` archive for Windows
* `.deb` bundle for Debian/Ubuntu...
* `.rpm` bundle for CentOS/Fedora... 

### Publish

The third step of of the job will publish the new version via different method depending on the target.

#### Cellar

`.tar.gz`, `.zip`, `.deb` and `.rpm` (and corresponding `.sha256` files) are published on Clever Cloud's Cellar.
That's why we need `S3_KEY_ID` and `S3_SECRET_KEY` from the credentials.

* If it's a stable version we publish the files under `X.Y.Z` but also under `latest`.
* If it's a beta version we only publish the files under `X.Y.Z-beta.W`.

#### Bintray

`.deb` and `.rpm` are published on Bintray.
That's why we need `BINTRAY_API_KEY` from the credentials.

* `.deb` are published on [Bintray](https://bintray.com/clevercloud/deb).
  * We use the `distribution` metadata to identify beta versions.
* `.rpm` are published on [Bintray](https://bintray.com/clevercloud/rpm).

#### Archlinux

For Archlinux, a new commit is created and pushed to AUR.
That's why we need the `CI_CLEVER_CLOUD_SSH_KEY` SSH key from the credentials.

* The new commit updates all files of the given repo using the templates in `templates/arch`.
* We use [clever-tools-bin](https://aur.archlinux.org/packages/clever-tools-bin/) for stable versions.
* We use [clever-tools-bin-beta](https://aur.archlinux.org/packages/clever-tools-bin-beta/) for beta versions.

#### Homebrew

For homebrew, a new commit is created and pushed to a homebrew tap on GitHub.
That's why we need the `CI_CLEVER_CLOUD_SSH_KEY` SSH key from the credentials.

* The new commit updates all files of the given repo using the templates in `templates/brew`.
* We use [homebrew-tap](https://github.com/CleverCloud/homebrew-tap) for stable versions.
* We use [homebrew-tap-beta](https://github.com/CleverCloud/homebrew-tap-beta) for beta versions.

#### npm

We publish new versions on [npmjs.org](https://www.npmjs.com/package/clever-tools) via `npm publish`.
That's why we need `NPM_TOKEN` from the credentials.

* This `NPM_TOKEN` is generated from the `clevercloud-ci` account.
* If it's a beta version, we use the npm `beta` tag so users don't get a beta without explicitly asking for one.

#### Docker Hub

We publish new versions on [Docker Hub](https://hub.docker.com/r/clevercloud/clever-tools/) using automated builds.
They are triggered for new commits created and pushed to a [GitHub repo](https://github.com/CleverCloud/clever-tools-dockerhub).
That's why we need the `CI_CLEVER_CLOUD_SSH_KEY` SSH key from the credentials.

* The new commit updates all files of the given repo using the templates in `templates/dockerhub`.

## How do I release a new version?

Here's the guide to create a new release:

1. Make sure you updated the `CHANGELOG.md` with all the new features and bugfixes.
2. Make sure the unit tests all pass (on Travis CI).
3. Decide if you're doing a **major**, **minor** or **patch** version or event a **prerelease** according to the [semver spec](https://semver.org/spec/v2.0.0.html).
4. Make sure the commit you want to version is on master.
5. run the `npm version` command with the right parameters (see details below).
  * This will update `package.json` and `package-lock.json` in a new commit.
  * This will create a git tag.
6. Push the updated master branch with the new tag on GitHub (see details below).
7. Follow the build on Jenkins and everything should be OK!

`npm version` for a stable version:

```sh
# For a major version, ex: 1.2.3 => 2.0.0
npm version major
# For a minor version, ex: 1.2.3 => 1.3.0
npm version minor
# For a patch version, ex: 1.2.3 => 1.2.4
npm version patch
```

`npm version` for a beta version:

```sh
# For a premajor version, ex: 1.2.3 => 2.0.0-beta.1
npm version premajor
# For a preminor version, ex: 1.2.3 => 1.3.0-beta.1 
npm version preminor
# For a prepatch version, ex: 1.2.3 => 1.2.4-beta.1
npm version prepatch
# For a pre release, ex: 1.2.3-beta.1 => 1.2.3-beta.2
npm version prerelease
```

Pushing new master and new tag:

```sh
git push origin master --tags
```


