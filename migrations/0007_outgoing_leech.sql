ALTER TABLE "character_definitions" RENAME COLUMN "character" TO "characters";--> statement-breakpoint
ALTER TABLE "character_definitions" DROP CONSTRAINT "character_definitions_character_pinyin_unique";--> statement-breakpoint
ALTER TABLE "character_definitions" ADD CONSTRAINT "character_definitions_characters_pinyin_unique" UNIQUE("characters","pinyin");