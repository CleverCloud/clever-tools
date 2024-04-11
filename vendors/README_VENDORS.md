# Why do we have this vendors directory?

We depend on the the [`curlconverter`](https://www.npmjs.com/package/curlconverter) package.
It's only available as ESM.
This module format is no problem for a recent version of Node.js but it does not work when we build our auto packaged binary version of the CLI with pkg.

The next steps for this project are:

* find a replacement for pkg to build an auto packaged binary
* move the whole project to ESM
* eventually bundle/compile the code to a single file before building the binary

Before doing this, we introduced a quick & simple solution, juste for curlconverter:

* add `rollup` to dev dependencies
* bundle the only file we need (`node_modules/curlconverter/dist/src/parse.js`) to a single CJS file with rollup
* version the bundle in the repo (`vendors/curlconverter-parse.js`)
* add a npm task to build the bundle again if needed
