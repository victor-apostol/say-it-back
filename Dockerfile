FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 7777

CMD ["sh", "-c", "/app/entrypoint.sh"]
