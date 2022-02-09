# Nexus configuration

We use a self hosted Nexus repository to distribute `.deb`, `.nupkg` and `.rpm`.
It's available at [https://nexus.clever-cloud.com/](https://nexus.clever-cloud.com/).

## Repositories

### `.deb` repositories

We have two repositories for `.deb` packages:

* stable: [deb](https://nexus.clever-cloud.com/#browse/browse:deb)
* beta: [deb-beta](https://nexus.clever-cloud.com/#browse/browse:deb-beta)

Link to Nexus [apt-repositories docs](https://help.sonatype.com/repomanager3/formats/apt-repositories).

The repository is signed with the PGP key `Clever Cloud Nexus (deb)`.

* The public key is available publised on the Cellar at [https://clever-tools.clever-cloud.com/gpg/cc-nexus-deb.public.gpg.key](https://clever-tools.clever-cloud.com/gpg/cc-nexus-deb.public.gpg.key)
* The private key, public key and passphrase are stored in our vault.

### `.nupkg` repositories

We have two repositories for `.nupkg` packages:

* stable: [nupkg](https://nexus.clever-cloud.com/#browse/browse:nupkg)
* beta: [nupkg-beta](https://nexus.clever-cloud.com/#browse/browse:nupkg-beta)

Link to Nexus [nuget-repositories docs](https://help.sonatype.com/repomanager3/formats/nuget-repositories).

WIP

### `.rpm` repositories

We have two repositories for `.rpm` packages:

* stable: [rpm](https://nexus.clever-cloud.com/#browse/browse:rpm)
* beta: [rpm-beta](https://nexus.clever-cloud.com/#browse/browse:rpm-beta)

Link to Nexus [yum-repositories docs](https://help.sonatype.com/repomanager3/formats/yum-repositories).

The repository is not signed but the `.rpm` packages are.

* The repo description is maintained in this git repo at `templates/rpm/cc-nexus-rpm.repo`.
  * It's published on the Cellar at [https://clever-tools.clever-cloud.com/repos/cc-nexus-rpm.repo](https://clever-tools.clever-cloud.com/repos/cc-nexus-rpm.repo)
* The public key is available publised on the Cellar at [https://clever-tools.clever-cloud.com/gpg/cc-nexus-rpm.public.gpg.key](https://clever-tools.clever-cloud.com/gpg/cc-nexus-rpm.public.gpg.key)
* The private key, public key and passphrase are stored in our vault.

### PGP Keys

Steps to follow to generate a new pair of PGP keys:

* Prepate a random string for the passphrase (30 chars is good)
* Run `gpg --gen-key`
* Name: `Clever Cloud Nexus (deb)`
* Email: ci@clever-cloud.com
* Get the ID of the new generated key with `gpg --list-keys`
* Export the public key in a file
  * `gpg --armor --output cc-nexus-deb.public.gpg.key --export <KEY_ID>`
* Publish the public key on the Cellar
  * `s3cmd -c .s3cfg put --acl-public cc-nexus-deb.public.gpg.key s3://clever-tools.clever-cloud.com/gpg/` 
* Export the private key in a file
  * `gpg --armor --output cc-nexus-deb.private.gpg.key --export-secret-key <KEY_ID>`
* Update the private key where it's needed
  * The `deb` private key and passphrase need to be set in both `deb` and `deb-stable` repo in Nexus.
  * The `rpm` private key and passphrase need to be set in Jenkins.
* Combine both keys into one file
  * `cat cc-nexus-deb.*.gpg.key cc-nexus-deb.combined.gpg.key`
* Add the combined key to the vault along with the random passphrase.

This is an example for `deb` but the same goes for `rpm`.
