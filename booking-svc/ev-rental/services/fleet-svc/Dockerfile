FROM node:20-bullseye

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN ./node_modules/.bin/prisma generate
EXPOSE 3003
CMD ["npm","run","start"]
