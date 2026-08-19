import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Crea la tabella operating-costs per i costi operativi mensili del negozio.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TABLE "operating_costs" (
        "id" serial PRIMARY KEY NOT NULL,
        "description" varchar NOT NULL,
        "amount" numeric NOT NULL,
        "frequency" varchar DEFAULT 'monthly',
        "category" varchar DEFAULT 'other',
        "is_active" boolean DEFAULT true,
        "notes" varchar,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );
    EXCEPTION WHEN duplicate_table THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "operating_costs";
  `)
}
