FROM node:20-alpine

WORKDIR /app

# Installa le dipendenze
COPY package.json ./
RUN npm install

# Copia il resto dell'applicazione
COPY . .

EXPOSE 3000

# Avvia il server di sviluppo Vite su 0.0.0.0:3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
