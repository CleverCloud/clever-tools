FROM jenkins/jnlp-slave

# We need this for all the installations
# We also need this for the docker sibling mode on Clever (not jenkins user)
USER root

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

RUN apt-get install -y rpm

RUN apt-get install -y ruby ruby-dev rubygems build-essential
RUN gem install --no-ri --no-rdoc fpm

RUN apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

RUN echo \
    "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

RUN apt-get update -y

RUN apt-get install -y docker-ce docker-ce-cli containerd.io
