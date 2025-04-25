import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from original template
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
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
});

export const vocabularySchema = createInsertSchema(vocabulary).pick({
  chinese: true,
  pinyin: true,
  english: true,
  active: true,
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
  wordId: text("word_id").notNull(),
  correctCount: text("correct_count").default("0").notNull(),
  attemptCount: text("attempt_count").default("0").notNull(),
  lastPracticed: text("last_practiced").default("0").notNull(),
});

export const wordProficiencySchema = createInsertSchema(wordProficiency).pick({
  wordId: true,
  correctCount: true,
  attemptCount: true,
  lastPracticed: true,
});

export type InsertWordProficiency = z.infer<typeof wordProficiencySchema>;
export type WordProficiency = typeof wordProficiency.$inferSelect;
