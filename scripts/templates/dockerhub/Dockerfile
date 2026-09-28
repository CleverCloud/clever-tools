FROM debian:trixie-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl

RUN curl --output clever-tools_linux.tar.gz <%= downloadUrl %> \
	&& mkdir clever-tools_linux \
	&& tar xvzf clever-tools_linux.tar.gz -C clever-tools_linux --strip-components=1 \
	&& cp clever-tools_linux/clever /usr/local/bin

# The release stage needs a full git (with git-remote-https and its libraries) for the system-git feature,
# so we use a slim Debian base instead of copying the clever binary and its libraries into busybox.
FROM debian:trixie-slim AS release

LABEL version="<%= version %>" \
	maintainer="<%= maintainer %>" \
	description="<%= description %>" \
	license="<%= license %>"

RUN apt-get update && apt-get install -y --no-install-recommends \
	ca-certificates \
	curl \
	git \
	jq \
	&& rm -rf /var/lib/apt/lists/* \
	## The mounted project (/actions, or /__w/... and /builds/... in CI) is usually owned by another user,
	## git refuses to work in it unless it is a safe directory
	&& git config --system --add safe.directory '*'

COPY --from=build /usr/local/bin/clever /usr/local/bin/clever

VOLUME ["/actions"]
WORKDIR /actions

ENTRYPOINT ["clever"]
