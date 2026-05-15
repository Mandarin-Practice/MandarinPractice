ALTER TABLE "character_compounds" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "characters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "character_compounds" CASCADE;--> statement-breakpoint
DROP TABLE "characters" CASCADE;--> statement-breakpoint
ALTER TABLE "character_definitions" DROP CONSTRAINT "character_definitions_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "character_definitions" ADD COLUMN "character" text NOT NULL;--> statement-breakpoint
ALTER TABLE "character_definitions" ADD COLUMN "pinyin" text NOT NULL;--> statement-breakpoint
ALTER TABLE "character_definitions" DROP COLUMN "character_id";--> statement-breakpoint
ALTER TABLE "character_definitions" DROP COLUMN "order";--> statement-breakpoint
ALTER TABLE "character_definitions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "character_definitions" ADD CONSTRAINT "character_definitions_character_pinyin_unique" UNIQUE("character","pinyin");