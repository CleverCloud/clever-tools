# Clever Tools Docker Image

This is a lightweight Docker image intended to be used mostly in CI environment.

## How to use

The WORKDIR is `/actions`. It's also available as a volume. You need to give your token and secret in order to authenticate.

Here's an example to test connectivity:

```
docker run  -e CLEVER_TOKEN=yourtoken -e CLEVER_SECRET=yoursecret -v ${pwd}:/actions clevercloud/clever-tools profile
```
