import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

type ModulesConfig = NonNullable<Parameters<typeof defineConfig>[0]>["modules"]

// Moduli in forma ARRAY (come da docs Medusa v2 per i moduli custom/redis).
const modules = [
  {
    resolve: "./src/modules/procurement",
  },
  // Moduli Redis espliciti quando REDIS_URL è presente (produzione):
  // event bus + workflow engine + cache reali (in dev senza REDIS_URL resta il fallback in-memory).
  ...(process.env.REDIS_URL
    ? [
        {
          resolve: "@medusajs/medusa/event-bus-redis",
          options: { redisUrl: process.env.REDIS_URL },
        },
        {
          resolve: "@medusajs/medusa/workflow-engine-redis",
          options: { redis: { redisUrl: process.env.REDIS_URL } },
        },
        {
          resolve: "@medusajs/medusa/cache-redis",
          options: { redisUrl: process.env.REDIS_URL },
        },
      ]
    : []),
  // Stripe payment provider: registrato SOLO se STRIPE_SECRET_KEY è presente
  // (in dev senza chiave il checkout non è disponibile, il core payment resta attivo
  // con il provider di sistema). Da F2 verrà attivato in modo permanente.
  ...(process.env.STRIPE_SECRET_KEY
    ? [
        {
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
      ]
    : []),
]

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