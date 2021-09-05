FROM node:14

WORKDIR /src/storecle
ADD . /src/storecle
RUN yarn install
