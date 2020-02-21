FROM node

WORKDIR /montaan

RUN yarn install-deps --quiet
