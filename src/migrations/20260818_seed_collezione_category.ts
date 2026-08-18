import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Seed: aggiunge la categoria "Collezione" (kind = product) se non esiste.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "categories" ("name", "slug", "kind", "created_at", "updated_at")
    SELECT 'Collezione', 'collezione', 'product', now(), now()
    WHERE NOT EXISTS (
      SELECT 1 FROM "categories" WHERE "slug" = 'collezione'
    );
  `)
}

export async function down({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "categories" WHERE "slug" = 'collezione';
  `)
}
