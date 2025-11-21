FROM node:18-alpine

# Cài đặt Python và build tools cần thiết cho bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8000

CMD ["node", "index.js"]