import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Allinea l'indice di orders.stripe_session_id allo schema generato da Payload:
// la live ha l'indice della migration legacy (orders_stripe_session_id_unique,
// UNIQUE parziale WHERE NOT NULL), mentre il config (unique: true) genera
// orders_stripe_session_id_idx (UNIQUE pieno). Entrambi garantiscono lo stesso
// dedup webhook; questo porta la live esattamente allo schema teorico.
// L'ordine è sicuro: si crea il nuovo indice PRIMA di droppare il vecchio
// (nessuna finestra senza vincolo di unicità).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripe_session_id_idx"
      ON "orders" ("stripe_session_id");
    DROP INDEX IF EXISTS "orders_stripe_session_id_unique";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "orders_stripe_session_id_unique"
      ON "orders" ("stripe_session_id")
      WHERE "stripe_session_id" IS NOT NULL;
    DROP INDEX IF EXISTS "orders_stripe_session_id_idx";
  `)
}
