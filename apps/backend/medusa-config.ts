import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

type ModulesConfig = NonNullable<Parameters<typeof defineConfig>[0]>["modules"]

// Modulo custom "procurement" (lotti, FIFO, costo medio) — core bespoke del dominio.
// Stripe payment provider: registrato SOLO se STRIPE_SECRET_KEY è presente
// (in dev senza chiave il checkout non è disponibile, il core payment resta attivo
// con il provider di sistema). Da F2 verrà attivato in modo permanente.
const modules = {
  procurement: {
    resolve: "./src/modules/procurement",
  },
  ...(process.env.STRIPE_SECRET_KEY
    ? {
        payment: {
          resolve: "@medusajs/medusa/payment",
          options: {
            providers: [
              {
                resolve: "@medusajs/payment-stripe",
                id: "stripe",
                options: {
                  apiKey: process.env.STRIPE_SECRET_KEY,
                  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                },
              },
            ],
          },
        },
      }
    : {}),
} as ModulesConfig

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules,
})