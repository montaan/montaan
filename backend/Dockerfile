FROM node

WORKDIR /backend
ENV PATH /backend/node_modules/.bin:$PATH

RUN curl https://dl.google.com/go/go1.13.8.linux-amd64.tar.gz | tar -C /usr/local -xz && /usr/local/go/bin/go get github.com/google/codesearch/cmd/...

COPY ./package.json ./yarn.lock ./
RUN yarn
