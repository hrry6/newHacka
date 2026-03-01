FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache netcat-openbsd

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD while ! nc -z postgres 5432; do sleep 1; done && node server.js