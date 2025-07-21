ALTER TABLE "word_proficiency" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "word_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "correct_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "correct_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "attempt_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "attempt_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "last_practiced" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "last_practiced" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "word_proficiency" ALTER COLUMN "last_practiced" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "word_proficiency" DROP COLUMN "is_saved";--> statement-breakpoint
ALTER TABLE "word_proficiency" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD CONSTRAINT "word_proficiency_user_id_word_id_unique" UNIQUE("user_id","word_id");