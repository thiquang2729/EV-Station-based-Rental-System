FROM node:20-bullseye

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# generate prisma client trước khi start
RUN ./node_modules/.bin/prisma generate
EXPOSE 3002
# Start service (schema should be managed outside container startup)
CMD ["node","src/index.js"]
