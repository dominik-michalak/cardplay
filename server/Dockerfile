FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY tsconfig.base.json ./

RUN npm ci

COPY shared/ ./shared/
RUN npm run build --workspace=shared

COPY server/ ./server/
WORKDIR /app/server

CMD ["npm", "run", "dev"]