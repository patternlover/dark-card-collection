import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Fix schema drift live: `payload_locked_documents_rels` era senza la colonna
// `purchases_id` (collection Purchases nel config). Ogni write Payload (document
// locking) esegue una SELECT su questa tabella riferendo tutte le colonne *_id →
// "column purchases_id does not exist" → HTTP 500 su update/create/delete.
// La migration è idempotente: su DB già allineati (push/fresh) è un no-op.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'purchases_id'
         ) THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "purchases_id" integer;
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conname = 'payload_locked_documents_rels_purchases_fk'
         ) THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_purchases_fk"
          FOREIGN KEY ("purchases_id") REFERENCES "public"."purchases"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_purchases_id_idx"
      ON "payload_locked_documents_rels" USING btree ("purchases_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_purchases_id_idx";

    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conname = 'payload_locked_documents_rels_purchases_fk'
         ) THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_purchases_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'purchases_id'
         ) THEN
        ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "purchases_id";
      END IF;
    END $$;
  `)
}
