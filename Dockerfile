FROM node:24
WORKDIR /usr/src/app

RUN npm install -g nodemon

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "src/server.js"]