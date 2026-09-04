# Medusa backend — Dark Card Collection (produzione)
# Immagine node:22-slim (Medusa richiede Node >= 20.19 / 22.12+).
FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
# Il build di Medusa v2 scrive in .medusa (server + client + types); la config
# compilata sta in .medusa/server/medusa-config.js. `medusa start` la usa direttamente.
COPY --from=build /app/.medusa ./.medusa
EXPOSE 9000
CMD ["pnpm", "start"]