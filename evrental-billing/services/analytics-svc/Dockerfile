FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
EXPOSE 8083
CMD [ "node", "src/server.js" ]
