FROM node:20-bullseye

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# generate prisma client trước khi start
RUN ./node_modules/.bin/prisma generate
EXPOSE 3002
# Ensure DB schema exists in dev, then start service
CMD ["sh","-c","./node_modules/.bin/prisma db push && node src/index.js"]
