FROM node:20-slim
WORKDIR /app

# install deps first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
