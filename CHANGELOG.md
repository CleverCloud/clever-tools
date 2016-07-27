# 0.5.2

 - Fix default domain name choice in `clever open`
 - Allow to choose a specific commit in `clever restart`
 - Allow to restart an application without using cache

# 0.5.1

 - Update readme with `0.5.0` changes
 - Update completion and documentation for new java instances
 - Fix issue with installation on ubuntu machines
 - Fix `clever scale` behaviour

# 0.5.0

 - Node 6 support (Arnaud Lefebvre)
 - More friendly way to specify applications, organisations and addons by name
   instead of ids. The syntax `org_name/app_name` is now deprecated
   (issues #51/#67)
 - Add support for service dependencies with `clever service` and `clever
   published-config` commands (issue #55)
 - Add `--before` and `--after` flags to `clever logs` to fetch logs at a
   specific date/time (issue #49)
 - Let the user create a github-linked application (issue #64)
 - Let the user set a default application (issue #30)
 - `clever addon` commands are now relative to owners, not applications
 - Add `clever open` to open an application in the browser (issue #43)
 - Rename command `list` to `applications` (issue #31)
 - Automatically reconnect websocket when the connection is closed (Arnaud
   Lefebvre)
 - Use mocha to run tests (Arnaud Lefebvre)

# 0.4.0

 - Add `clever restart` command to restart a running application (Clément Delafargue)
 - Add `clever scale` command to edit scalability settinsg (Benjamin Drouard)
 - Forward compatible support for new application creation API (Julien Durillon)
 - Various bug fixes / UX improvements (Clément Delafargue, Marc-Antoine Perennou)

# 0.3.4

 - Support for node v4 (Alexandre Berthaud)
 - Support being called from a directory (Alexandre Berthaud)
 - Clean up autocompletion installation scripts (Marc-Antoine Perennou)
 - Fix environment variables definition

# 0.3.3

 - Fix crash when pushing for the first time
 - Quit at the end of a deployment with the right exit code
 - Display more information when SSH auth fails

# 0.3.2

 - Fix crash when config files were missing
 - More information in clever login

# 0.3.1

 - Fix postinstall script

# 0.3.0

 - Add color to deployment related log lines
 - Rename `log` command to `logs`
 - Return with error or success status at the end of a deployment in `clever deploy -q`
 - Import & export env variables
 - Only deploy if there is new code to push (overridable with `--redeploy`)
 - Allow to force a deployment with `--force` (à la `git push`)
 - List linked applications with `clever list`
 - Rename an addon
 - Easy autocompletion installation

# 0.2.2

 - Autocomplete local branches in `clever deploy`
 - Add `--follow` option to `clever activity`
 - Status information in `clever deploy -q`
 - Addon support

# 0.2.2

 - Display messages when waiting for logs
 - Better error messages when specifying an alias
 - Use provided alias when creating an application

# 0.2.1

Apply bug fixes from dependencies

# 0.2.0

Initial public release
