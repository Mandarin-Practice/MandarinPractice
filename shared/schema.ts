import { pgTable, text, serial, integer, boolean, timestamp, varchar, numeric, unique, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// User schema with Firebase authentication support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  firebaseUid: text("firebase_uid").unique(),
  email: text("email").unique(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  currentStreak: integer("current_streak").default(0), // Current streak of correct answers
  highestStreak: integer("highest_streak").default(0), // Highest streak ever achieved
  currentScore: integer("current_score").default(0), // Current score based on streak
  highestScore: integer("highest_score").default(0), // Highest score ever achieved
  lastPracticeDate: timestamp("last_practice_date"), // To track daily streaks
  createdAt: timestamp("created_at").defaultNow(),
  speechRate: numeric("speech_rate").default("1.0"),
  selectedVoiceURI: text("selected_voice_uri"),
  autoReplay: boolean("auto_replay").default(false),
  matchStrictness: text("match_strictness").default("moderate"),
  timeWeight: integer("time_weight").default(3),
  difficulty: text("difficulty").default("beginner")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firebaseUid: true,
  email: true,
  displayName: true,
  photoUrl: true,
  currentStreak: true,
  highestStreak: true,
  currentScore: true,
  highestScore: true,
  lastPracticeDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Word proficiency schema to track mastery of individual words
export const wordProficiency = pgTable("word_proficiency", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Link to user account
  chinese: text("chinese").notNull(),
  pinyin: text("pinyin").notNull(),
  english: text("english").notNull(),
  correctCount: integer("correct_count").default(0).notNull(),
  attemptCount: integer("attempt_count").default(0).notNull(),
  percentCorrect: doublePrecision("percent_correct")
    .generatedAlwaysAs(sql`CASE WHEN attempt_count = 0 THEN 0 ELSE ROUND((correct_count * 100.0) / attempt_count, 2) END`)
    .notNull(),
  lastPracticed: timestamp("last_practiced").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
  category: text("category"), // Category like "food", "travel", etc.
}, (table) => ({
  // Add unique constraint on chinese + pinyin combination
  chinesePinyinUnique: unique().on(table.userId, table.chinese, table.pinyin),
}));

export const wordProficiencySchema = createInsertSchema(wordProficiency).pick({
  userId: true,
  chinese: true,
  pinyin: true,
  english: true,
  correctCount: true,
  attemptCount: true,
  lastPracticed: true,
  active: true,
  category: true,
});

export type InsertFullProficiency = z.infer<typeof wordProficiencySchema>;
export type FullProficiency = typeof wordProficiency.$inferSelect;
export type Vocabulary = {
  id: number;
  chinese: string;
  pinyin: string;
  english: string;
  active: boolean;
  category: string | null;
}
export type Proficiency = {
  id: number;
  correctCount: number;
  attemptCount: number;
  percentCorrect: number;
  lastPracticed: Date;
}

// Chinese Characters schema - for the character dictionary
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  character: varchar("character", { length: 10 }).notNull().unique(), // The actual Chinese character
  pinyin: text("pinyin").notNull(), // Pronunciation in pinyin, could have multiple comma-separated values
  strokes: integer("strokes"), // Number of strokes
  radical: varchar("radical", { length: 10 }), // Base radical
  hskLevel: integer("hsk_level"), // HSK proficiency level (1-6)
  frequency: integer("frequency"), // How common the character is (lower = more common)
  createdAt: timestamp("created_at").defaultNow(),
});

export const characterSchema = createInsertSchema(characters).pick({
  character: true,
  pinyin: true,
  strokes: true,
  radical: true,
  hskLevel: true,
  frequency: true,
});

export type InsertCharacter = z.infer<typeof characterSchema>;
export type Character = typeof characters.$inferSelect;

// Character Definitions schema - since each character can have multiple meanings
export const characterDefinitions = pgTable("character_definitions", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => characters.id),
  definition: text("definition").notNull(), // Single definition/meaning
  partOfSpeech: varchar("part_of_speech", { length: 50 }), // noun, verb, adjective, etc.
  example: text("example"), // Example usage
  order: integer("order").default(1).notNull(), // Order of definitions (primary, secondary)
  createdAt: timestamp("created_at").defaultNow(),
});

export const characterDefinitionSchema = createInsertSchema(characterDefinitions).pick({
  characterId: true,
  definition: true,
  partOfSpeech: true,
  example: true,
  order: true,
});

export type InsertCharacterDefinition = z.infer<typeof characterDefinitionSchema>;
export type CharacterDefinition = typeof characterDefinitions.$inferSelect;

export const wordProficiencyRelations = relations(wordProficiency, ({ one }) => ({
  user: one(users, {
    fields: [wordProficiency.userId],
    references: [users.id]
  }),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  definitions: many(characterDefinitions),
}));

// Character compounds table for relationships between characters and compound words
export const characterCompounds = pgTable("character_compounds", {
  id: serial("id").primaryKey(),
  compoundId: integer("compound_id").notNull().references(() => characters.id), // The multi-character word/phrase
  componentId: integer("component_id").notNull().references(() => characters.id), // The individual character that makes up the compound
  position: integer("position").notNull(), // Position of the character in the compound (0-based)
  createdAt: timestamp("created_at").defaultNow(),
});

export const characterCompoundSchema = createInsertSchema(characterCompounds).pick({
  compoundId: true,
  componentId: true,
  position: true,
});

export type InsertCharacterCompound = z.infer<typeof characterCompoundSchema>;
export type CharacterCompound = typeof characterCompounds.$inferSelect;

// Add compound relations to the existing character relations
export const characterCompoundsRelations = relations(characterCompounds, ({ one }) => ({
  compound: one(characters, {
    fields: [characterCompounds.compoundId],
    references: [characters.id]
  }),
  component: one(characters, {
    fields: [characterCompounds.componentId],
    references: [characters.id]
  }),
}));
