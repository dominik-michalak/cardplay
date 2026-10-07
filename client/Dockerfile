FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json ./shared/
COPY client/package.json ./client/
COPY tsconfig.base.json ./

RUN npm ci

COPY shared/ ./shared/
RUN npm run build --workspace=shared

COPY client/ ./client/
WORKDIR /app/client

CMD ["npm", "run", "dev", "--", "--host"]