clever-tools
============

Play with Clever-Cloud in your terminal.

How to install
--------------

Run `npm install -g` in the root directory of the project.

How to use
----------

- Login: clever login (at the moment, you need to run the console locally)
- Create an application: clever app create <name> -t <type> [-r <region>] [--remote <remote>]
- Deploy your application: clever deploy <remote> [--branch <branch>]

Examples
--------

```sh
  cd node_project
  clever login
  clever app create "Node.js application" -t node -r mtl
  clever deploy clever
```

How to send feedback?
---------------------

[Send us an email!](mailto:support@clever-cloud.com) or [submit an issue](https://gitlab.clever-cloud.com/clever-cloud/clever-tools/issues) if you are allowed to.
