FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY prisma-whitehouse ./prisma-whitehouse
RUN npx prisma generate --schema=./prisma-whitehouse/schema.prisma

COPY src ./src
EXPOSE 8083
CMD [ "node", "src/server.js" ]
