# Published to https://hub.docker.com/r/clevercloud/clever-tools-builder

FROM jenkins/inbound-agent

USER root

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

RUN apt-get install -y rpm

RUN apt-get install -y ruby ruby-dev rubygems build-essential
RUN gem install fpm

USER jenkins
