FROM node

WORKDIR /montaan

RUN apt install golang
RUN mkdir /root/go
RUN GOPATH=/root/go go get github.com/google/codesearch/cmd/...
RUN yarn global add dependency-cruiser

RUN yarn install-deps --quiet
