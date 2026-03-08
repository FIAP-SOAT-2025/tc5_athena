FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma migrate dev
RUN npx prisma generate
RUN npm run build

# ---

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma migrate dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
