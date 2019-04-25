# Node 10 on an alpine linux image
FROM node:10-slim

WORKDIR /workdir

COPY package.json package-lock.json /workdir/

RUN npm install --production

COPY src /workdir/src
COPY pm2.config.js app.js /workdir/