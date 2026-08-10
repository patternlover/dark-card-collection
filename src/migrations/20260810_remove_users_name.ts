export const up = `
ALTER TABLE "users" DROP COLUMN IF EXISTS "name";
`;

export const down = `
ALTER TABLE "users" ADD COLUMN "name" varchar;
`;
