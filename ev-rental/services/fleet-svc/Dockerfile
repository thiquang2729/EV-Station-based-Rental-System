FROM node:20-bullseye

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3003
CMD ["npm","run","start"]
