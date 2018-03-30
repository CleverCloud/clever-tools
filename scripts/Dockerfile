FROM debian:stretch

ENV NODE_VERSION 8.3.0

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qqy && \
    apt-get install -y \
        python \
        g++ \
        curl \
        git \
        ruby \
        ruby-dev gcc \
        libffi-dev \
        make \
        libc-dev \
        rpm && \
    gem install --no-ri --no-rdoc fpm

ADD https://nodejs.org/download/release/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz /tmp/node.tar.gz
RUN cd /usr/local && \
    tar --strip-components 1 -xzf /tmp/node.tar.gz


