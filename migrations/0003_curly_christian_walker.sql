ALTER TABLE "vocabulary" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "vocabulary" CASCADE;--> statement-breakpoint
ALTER TABLE "word_proficiency" DROP CONSTRAINT "word_proficiency_user_id_word_id_unique";--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "last_practiced" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD COLUMN "chinese" text NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD COLUMN "pinyin" text NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD COLUMN "english" text NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "word_proficiency" DROP COLUMN "word_id";--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD CONSTRAINT "word_proficiency_user_id_chinese_pinyin_unique" UNIQUE("user_id","chinese","pinyin");