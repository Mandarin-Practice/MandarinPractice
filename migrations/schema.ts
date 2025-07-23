import { pgTable, foreignKey, serial, integer, boolean, text, timestamp, unique, varchar, numeric, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const learnedDefinitions = pgTable("learned_definitions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	definitionId: integer("definition_id").notNull(),
	isLearned: boolean("is_learned").default(true).notNull(),
	notes: text(),
	lastReviewed: timestamp("last_reviewed", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "learned_definitions_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.definitionId],
			foreignColumns: [characterDefinitions.id],
			name: "learned_definitions_definition_id_character_definitions_id_fk"
		}),
]);

export const characters = pgTable("characters", {
	id: serial().primaryKey().notNull(),
	character: varchar({ length: 10 }).notNull(),
	pinyin: text().notNull(),
	strokes: integer(),
	radical: varchar({ length: 10 }),
	hskLevel: integer("hsk_level"),
	frequency: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("characters_character_unique").on(table.character),
]);

export const practiceSession = pgTable("practice_session", {
	id: serial().primaryKey().notNull(),
	sentenceChinese: text("sentence_chinese").notNull(),
	sentencePinyin: text("sentence_pinyin").notNull(),
	sentenceEnglish: text("sentence_english").notNull(),
	userTranslation: text("user_translation").notNull(),
	accuracyScore: text("accuracy_score").notNull(),
	timeScore: text("time_score").notNull(),
	totalScore: text("total_score").notNull(),
	timestamp: text().notNull(),
});

export const characterDefinitions = pgTable("character_definitions", {
	id: serial().primaryKey().notNull(),
	characterId: integer("character_id").notNull(),
	definition: text().notNull(),
	partOfSpeech: varchar("part_of_speech", { length: 50 }),
	example: text(),
	order: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.characterId],
			foreignColumns: [characters.id],
			name: "character_definitions_character_id_characters_id_fk"
		}),
]);

export const characterCompounds = pgTable("character_compounds", {
	id: serial().primaryKey().notNull(),
	compoundId: integer("compound_id").notNull(),
	componentId: integer("component_id").notNull(),
	position: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.compoundId],
			foreignColumns: [characters.id],
			name: "character_compounds_compound_id_characters_id_fk"
		}),
	foreignKey({
			columns: [table.componentId],
			foreignColumns: [characters.id],
			name: "character_compounds_component_id_characters_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text(),
	firebaseUid: text("firebase_uid"),
	email: text(),
	displayName: text("display_name"),
	photoUrl: text("photo_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	currentStreak: integer("current_streak").default(0),
	highestStreak: integer("highest_streak").default(0),
	currentScore: integer("current_score").default(0),
	highestScore: integer("highest_score").default(0),
	lastPracticeDate: timestamp("last_practice_date", { mode: 'string' }),
	speechRate: numeric("speech_rate").default('1.0'),
	selectedVoiceUri: text("selected_voice_uri"),
	autoReplay: boolean("auto_replay").default(false),
	matchStrictness: text("match_strictness").default('moderate'),
	timeWeight: integer("time_weight").default(3),
	difficulty: text().default('beginner'),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_firebase_uid_unique").on(table.firebaseUid),
	unique("users_email_unique").on(table.email),
]);

export const wordProficiency = pgTable("word_proficiency", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	chinese: text().notNull(),
	pinyin: text().notNull(),
	english: text().notNull(),
	correctCount: integer("correct_count").default(0).notNull(),
	attemptCount: integer("attempt_count").default(0).notNull(),
	percentCorrect: doublePrecision("percent_correct").notNull().generatedAlwaysAs(sql`
CASE
    WHEN (attempt_count = 0) THEN (0)::numeric
    ELSE round((((correct_count)::numeric * 100.0) / (attempt_count)::numeric), 2)
END`),
	lastPracticed: timestamp("last_practiced", { mode: 'string' }).defaultNow().notNull(),
	active: boolean().default(true).notNull(),
	category: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "word_proficiency_user_id_users_id_fk"
		}),
	unique("word_proficiency_user_id_chinese_pinyin_unique").on(table.userId, table.chinese, table.pinyin),
]);
