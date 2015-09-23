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
