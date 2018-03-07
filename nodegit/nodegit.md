# nodegit.node archives 

## Context

`pkg` cannot package native dependencies like nodegit, that's why we need to release a `nodegit.node` file along with our packaged binary.
To do so, we're using the prebuilt nodegit archives for each platform.

⚠️ *When we build the linux release on a linux platform (our Jenkins for example), we're using the `nodegit.node` we built instead of the pre-built one.*

Those archives can be found here:

* https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-linux-x64.tar.gz
* https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-darwin-x64.tar.gz
* https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-win32-x64.tar.gz

v57 is the module version compatible with node v8.3.0

## How to fetch them

```
wget https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-linux-x64.tar.gz
tar --extract --file=nodegit-v0.20.3-node-v57-linux-x64.tar.gz Release/nodegit.node --transform 's/Release\//linux-/'
wget https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-darwin-x64.tar.gz
tar --extract --file=nodegit-v0.20.3-node-v57-darwin-x64.tar.gz Release/nodegit.node --transform 's/Release\//macos-/'
wget https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.20.3-node-v57-win32-x64.tar.gz
tar --extract --file=nodegit-v0.20.3-node-v57-win32-x64.tar.gz Release/nodegit.node --transform 's/Release\//win-/'
rm *.tar.gz
```
