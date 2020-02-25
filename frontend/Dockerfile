FROM node:alpine

WORKDIR /frontend

ENV PATH /backend/node_modules/.bin:$PATH

COPY ./package.json ./yarn.lock ./
RUN yarn
