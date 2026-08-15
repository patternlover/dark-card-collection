import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// I prodotti (item_category_1 = 'product') non devono avere attributi da carta:
// grade e condition vengono azzerati (la lingua è comune e resta).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "products" SET "grade" = NULL, "condition" = NULL
    WHERE "item_category_1" = 'product'
      AND ("grade" IS NOT NULL OR "condition" IS NOT NULL);

    -- stock NaN -> 0 (numeric Postgres supporta 'NaN')
    UPDATE "products" SET "quantity" = 0
    WHERE "quantity" IS NULL OR "quantity"::text ILIKE 'nan';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // nessuna inversione (dati distruttivi documentati)
}
