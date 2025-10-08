FROM node:20-bullseye

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# generate prisma client trước khi start
RUN npx prisma generate
EXPOSE 3002
CMD ["npm","run","start"]
