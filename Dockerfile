FROM node:18

WORKDIR /app

COPY package*.json ./

RUN apt update && apt install vim -y

RUN npm install

COPY . .

EXPOSE 7777

CMD ["sh", "-c", "/app/entrypoint.sh"]
