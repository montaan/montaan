FROM node

WORKDIR /montaan

RUN curl https://dl.google.com/go/go1.13.8.linux-amd64.tar.gz | tar -C /usr/local -xz
RUN /usr/local/go/bin/go get github.com/google/codesearch/cmd/...

RUN yarn install-deps --quiet
