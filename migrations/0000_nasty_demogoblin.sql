CREATE TABLE "character_compounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"compound_id" integer NOT NULL,
	"component_id" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "character_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"definition" text NOT NULL,
	"part_of_speech" varchar(50),
	"example" text,
	"order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"character" varchar(10) NOT NULL,
	"pinyin" text NOT NULL,
	"strokes" integer,
	"radical" varchar(10),
	"hsk_level" integer,
	"frequency" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "characters_character_unique" UNIQUE("character")
);
--> statement-breakpoint
CREATE TABLE "learned_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"definition_id" integer NOT NULL,
	"is_learned" boolean DEFAULT true NOT NULL,
	"notes" text,
	"last_reviewed" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "practice_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"sentence_chinese" text NOT NULL,
	"sentence_pinyin" text NOT NULL,
	"sentence_english" text NOT NULL,
	"user_translation" text NOT NULL,
	"accuracy_score" text NOT NULL,
	"time_score" text NOT NULL,
	"total_score" text NOT NULL,
	"timestamp" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"firebase_uid" text,
	"email" text,
	"display_name" text,
	"photo_url" text,
	"current_streak" integer DEFAULT 0,
	"highest_streak" integer DEFAULT 0,
	"current_score" integer DEFAULT 0,
	"highest_score" integer DEFAULT 0,
	"last_practice_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"speech_rate" numeric DEFAULT '1.0',
	"selected_voice_uri" text,
	"auto_replay" boolean DEFAULT false,
	"match_strictness" text DEFAULT 'moderate',
	"time_weight" integer DEFAULT 3,
	"difficulty" text DEFAULT 'beginner',
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" serial PRIMARY KEY NOT NULL,
	"chinese" text NOT NULL,
	"pinyin" text NOT NULL,
	"english" text NOT NULL,
	"active" text DEFAULT 'true' NOT NULL,
	"lesson_id" integer,
	"category" text,
	CONSTRAINT "vocabulary_chinese_pinyin_unique" UNIQUE("chinese","pinyin")
);
--> statement-breakpoint
CREATE TABLE "word_proficiency" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"word_id" text NOT NULL,
	"correct_count" text DEFAULT '0' NOT NULL,
	"attempt_count" text DEFAULT '0' NOT NULL,
	"last_practiced" text DEFAULT '0' NOT NULL,
	"is_saved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "character_compounds" ADD CONSTRAINT "character_compounds_compound_id_characters_id_fk" FOREIGN KEY ("compound_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_compounds" ADD CONSTRAINT "character_compounds_component_id_characters_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_definitions" ADD CONSTRAINT "character_definitions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learned_definitions" ADD CONSTRAINT "learned_definitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learned_definitions" ADD CONSTRAINT "learned_definitions_definition_id_character_definitions_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."character_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_proficiency" ADD CONSTRAINT "word_proficiency_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;