import { pgTable, text, serial, integer, boolean, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Vocabulary schema for Mandarin words
export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  chinese: text("chinese").notNull(),
  pinyin: text("pinyin").notNull(),
  english: text("english").notNull(),
  active: text("active").default("true").notNull(),
  lessonId: integer("lesson_id"), // Track which lesson this vocabulary word is from (11-20 for advanced)
  category: text("category"), // Category like "food", "travel", etc.
});

export const vocabularySchema = createInsertSchema(vocabulary).pick({
  chinese: true,
  pinyin: true,
  english: true,
  active: true,
  lessonId: true,
  category: true,
});

export type InsertVocabulary = z.infer<typeof vocabularySchema>;
export type Vocabulary = typeof vocabulary.$inferSelect;

// Practice session schema to track user progress
export const practiceSession = pgTable("practice_session", {
  id: serial("id").primaryKey(),
  sentenceChinese: text("sentence_chinese").notNull(),
  sentencePinyin: text("sentence_pinyin").notNull(), 
  sentenceEnglish: text("sentence_english").notNull(),
  userTranslation: text("user_translation").notNull(),
  accuracyScore: text("accuracy_score").notNull(),
  timeScore: text("time_score").notNull(),
  totalScore: text("total_score").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const practiceSessionSchema = createInsertSchema(practiceSession).pick({
  sentenceChinese: true,
  sentencePinyin: true,
  sentenceEnglish: true,
  userTranslation: true,
  accuracyScore: true,
  timeScore: true,
  totalScore: true,
  timestamp: true,
});

export type InsertPracticeSession = z.infer<typeof practiceSessionSchema>;
export type PracticeSession = typeof practiceSession.$inferSelect;

// Word proficiency schema to track mastery of individual words
export const wordProficiency = pgTable("word_proficiency", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Link to user account
  wordId: text("word_id").notNull(),
  correctCount: text("correct_count").default("0").notNull(),
  attemptCount: text("attempt_count").default("0").notNull(),
  lastPracticed: text("last_practiced").default("0").notNull(),
  isSaved: boolean("is_saved").default(false), // Whether this word is saved to user's list
  createdAt: timestamp("created_at").defaultNow(),
});

export const wordProficiencySchema = createInsertSchema(wordProficiency).pick({
  userId: true,
  wordId: true,
  correctCount: true,
  attemptCount: true,
  lastPracticed: true,
  isSaved: true,
});

export type InsertWordProficiency = z.infer<typeof wordProficiencySchema>;
export type WordProficiency = typeof wordProficiency.$inferSelect;

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

// User's learned character definitions - for tracking which definitions a user has learned
export const learnedDefinitions = pgTable("learned_definitions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  definitionId: integer("definition_id").notNull().references(() => characterDefinitions.id),
  isLearned: boolean("is_learned").default(true).notNull(), // Whether user has learned this definition
  notes: text("notes"), // Optional user notes on this definition
  lastReviewed: timestamp("last_reviewed").defaultNow(),
});

export const learnedDefinitionSchema = createInsertSchema(learnedDefinitions).pick({
  userId: true,
  definitionId: true,
  isLearned: true,
  notes: true,
});

export type InsertLearnedDefinition = z.infer<typeof learnedDefinitionSchema>;
export type LearnedDefinition = typeof learnedDefinitions.$inferSelect;

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  wordProficiencies: many(wordProficiency),
  learnedDefinitions: many(learnedDefinitions),
}));

export const wordProficiencyRelations = relations(wordProficiency, ({ one }) => ({
  user: one(users, {
    fields: [wordProficiency.userId],
    references: [users.id]
  }),
}));

export const charactersRelations = relations(characters, ({ many }) => ({
  definitions: many(characterDefinitions),
}));

export const characterDefinitionsRelations = relations(characterDefinitions, ({ one, many }) => ({
  character: one(characters, {
    fields: [characterDefinitions.characterId],
    references: [characters.id]
  }),
  learnedBy: many(learnedDefinitions),
}));

export const learnedDefinitionsRelations = relations(learnedDefinitions, ({ one }) => ({
  definition: one(characterDefinitions, {
    fields: [learnedDefinitions.definitionId],
    references: [characterDefinitions.id]
  }),
  user: one(users, {
    fields: [learnedDefinitions.userId],
    references: [users.id]
  }),
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
