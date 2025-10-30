FROM node:20-alpine
# Prisma cần openssl khi generate client
RUN apk add --no-cache openssl
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY .env* ./
ENV PORT=8082
EXPOSE 8082
CMD [ "node", "src/server.js" ]
