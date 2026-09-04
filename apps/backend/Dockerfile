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
# Il build di Medusa v2 scrive in .medusa (server + client + types).
# `medusa start` carica la config da /app/medusa-config (root): la copiamo
# dalla versione compilata in .medusa/server/medusa-config.js.
COPY --from=build /app/.medusa ./.medusa
COPY --from=build /app/.medusa/server/medusa-config.js ./medusa-config.js
# La config risolve i moduli custom via ./src/... : copiamo la versione compilata.
COPY --from=build /app/.medusa/server/src ./src
# medusa start serve l'admin da ./public/admin (ADMIN_RELATIVE_OUTPUT_DIR).
COPY --from=build /app/.medusa/server/public ./public
EXPOSE 9000
CMD ["pnpm", "start"]