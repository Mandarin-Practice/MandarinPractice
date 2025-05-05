import { 
  vocabulary, 
  type Vocabulary, 
  type InsertVocabulary, 
  type WordProficiency, 
  type InsertWordProficiency,
  type Character,
  type InsertCharacter,
  type CharacterDefinition,
  type InsertCharacterDefinition,
  type LearnedDefinition,
  type InsertLearnedDefinition,
  characters,
  characterDefinitions,
  learnedDefinitions 
} from "@shared/schema";
import { db } from "./db";
import { eq, like, desc, asc, and, or, sql } from "drizzle-orm";

// Interface for CRUD operations on vocabulary
export interface IStorage {
  // Vocabulary methods
  getAllVocabulary(): Promise<Vocabulary[]>;
  getVocabulary(id: number): Promise<Vocabulary | undefined>;
  addVocabulary(word: InsertVocabulary): Promise<Vocabulary>;
  updateVocabulary(id: number, updates: Partial<InsertVocabulary>): Promise<Vocabulary>;
  deleteVocabulary(id: number): Promise<void>;
  deleteAllVocabulary(): Promise<void>;
  
  // Word proficiency methods
  getWordProficiency(wordId: number): Promise<WordProficiency | undefined>;
  updateWordProficiency(wordId: number, isCorrect: boolean): Promise<WordProficiency>;
  resetWordProficiency(wordId: number): Promise<void>;
  
  // Chinese character dictionary methods
  searchCharacters(query: string): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  getCharacterByValue(char: string): Promise<Character | undefined>;
  addCharacter(character: InsertCharacter): Promise<Character>;
  getCharacterDefinitions(characterId: number): Promise<CharacterDefinition[]>;
  addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition>;
  updateCharacterDefinition(id: number, updates: Partial<InsertCharacterDefinition>): Promise<CharacterDefinition>;
  deleteCharacterDefinition(id: number): Promise<void>;
  
  // User learned definitions methods
  getLearnedDefinitions(userId: number): Promise<LearnedDefinition[]>;
  toggleLearnedDefinition(userId: number, definitionId: number, isLearned: boolean): Promise<LearnedDefinition>;
  updateLearnedDefinitionNotes(id: number, notes: string): Promise<LearnedDefinition>;
}

// Don't use MemStorage anymore, this is just a stub to satisfy the interface
// We're using DatabaseStorage instead
export class MemStorage implements IStorage {
  private vocabulary: Map<number, Vocabulary>;
  private wordProficiency: Map<number, WordProficiency>;
  private currentVocabularyId: number;
  private currentProficiencyId: number;

  constructor() {
    this.vocabulary = new Map();
    this.wordProficiency = new Map();
    this.currentVocabularyId = 1;
    this.currentProficiencyId = 1;
  }

  async getAllVocabulary(): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values());
  }

  async getVocabulary(id: number): Promise<Vocabulary | undefined> {
    return this.vocabulary.get(id);
  }

  async addVocabulary(word: InsertVocabulary): Promise<Vocabulary> {
    const id = this.currentVocabularyId++;
    const newWord: Vocabulary = { ...word, id, active: word.active || "true" };
    this.vocabulary.set(id, newWord);
    return newWord;
  }

  async updateVocabulary(id: number, updates: Partial<InsertVocabulary>): Promise<Vocabulary> {
    const word = this.vocabulary.get(id);
    if (!word) {
      throw new Error(`Vocabulary with ID ${id} not found`);
    }
    
    const updatedWord: Vocabulary = { ...word, ...updates };
    this.vocabulary.set(id, updatedWord);
    return updatedWord;
  }

  async deleteVocabulary(id: number): Promise<void> {
    this.vocabulary.delete(id);
  }

  async deleteAllVocabulary(): Promise<void> {
    this.vocabulary.clear();
  }

  // Word proficiency methods
  async getWordProficiency(wordId: number): Promise<WordProficiency | undefined> {
    return undefined;
  }

  async updateWordProficiency(wordId: number, isCorrect: boolean): Promise<WordProficiency> {
    const id = this.currentProficiencyId++;
    const now = Date.now().toString();
    const proficiency: WordProficiency = {
      id,
      wordId: wordId.toString(),
      correctCount: isCorrect ? "1" : "0",
      attemptCount: "1",
      lastPracticed: now
    };
    return proficiency;
  }

  async resetWordProficiency(wordId: number): Promise<void> {
    // Do nothing
  }
  
  // Stub implementations for character dictionary
  async searchCharacters(query: string): Promise<Character[]> {
    return [];
  }
  
  async getCharacter(id: number): Promise<Character | undefined> {
    return undefined;
  }
  
  async getCharacterByValue(char: string): Promise<Character | undefined> {
    return undefined;
  }
  
  async addCharacter(character: InsertCharacter): Promise<Character> {
    throw new Error("Method not implemented");
  }
  
  async getCharacterDefinitions(characterId: number): Promise<CharacterDefinition[]> {
    return [];
  }
  
  async addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition> {
    throw new Error("Method not implemented");
  }
  
  async updateCharacterDefinition(id: number, updates: Partial<InsertCharacterDefinition>): Promise<CharacterDefinition> {
    throw new Error("Method not implemented");
  }
  
  async deleteCharacterDefinition(id: number): Promise<void> {
    // Do nothing
  }
  
  // Stub implementations for learned definitions
  async getLearnedDefinitions(userId: number): Promise<LearnedDefinition[]> {
    return [];
  }
  
  async toggleLearnedDefinition(userId: number, definitionId: number, isLearned: boolean): Promise<LearnedDefinition> {
    throw new Error("Method not implemented");
  }
  
  async updateLearnedDefinitionNotes(id: number, notes: string): Promise<LearnedDefinition> {
    throw new Error("Method not implemented");
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Vocabulary methods
  async getAllVocabulary(): Promise<Vocabulary[]> {
    return await db.select().from(vocabulary);
  }

  async getVocabulary(id: number): Promise<Vocabulary | undefined> {
    const [vocab] = await db.select().from(vocabulary).where(eq(vocabulary.id, id));
    return vocab;
  }

  async addVocabulary(word: InsertVocabulary): Promise<Vocabulary> {
    // Check for exact duplicate
    const [exactDuplicate] = await db.select().from(vocabulary).where(
      and(
        eq(vocabulary.chinese, word.chinese),
        eq(vocabulary.pinyin, word.pinyin),
        eq(vocabulary.english, word.english)
      )
    );
    
    if (exactDuplicate) {
      return exactDuplicate;
    }
    
    // Check for Chinese character duplicate
    const [chineseDuplicate] = await db.select().from(vocabulary).where(
      eq(vocabulary.chinese, word.chinese)
    );
    
    if (chineseDuplicate) {
      // Merge information if needed
      const updatedWord = {
        ...chineseDuplicate,
        pinyin: chineseDuplicate.pinyin || word.pinyin,
        english: chineseDuplicate.english || word.english,
        active: "true"
      };
      
      const [updated] = await db.update(vocabulary)
        .set(updatedWord)
        .where(eq(vocabulary.id, chineseDuplicate.id))
        .returning();
        
      return updated;
    }
    
    // Add new word
    const [newVocab] = await db.insert(vocabulary)
      .values(word)
      .returning();
      
    return newVocab;
  }

  async updateVocabulary(id: number, updates: Partial<InsertVocabulary>): Promise<Vocabulary> {
    const [updated] = await db.update(vocabulary)
      .set(updates)
      .where(eq(vocabulary.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Vocabulary with ID ${id} not found`);
    }
    
    return updated;
  }

  async deleteVocabulary(id: number): Promise<void> {
    await db.delete(vocabulary).where(eq(vocabulary.id, id));
  }

  async deleteAllVocabulary(): Promise<void> {
    await db.delete(vocabulary);
  }

  // Word proficiency methods
  async getWordProficiency(wordId: number): Promise<WordProficiency | undefined> {
    const [proficiency] = await db.select().from(wordProficiency)
      .where(eq(wordProficiency.wordId, wordId.toString()));
    return proficiency;
  }

  async updateWordProficiency(wordId: number, isCorrect: boolean): Promise<WordProficiency> {
    // Find existing proficiency or create new one
    const [existingProf] = await db.select().from(wordProficiency)
      .where(eq(wordProficiency.wordId, wordId.toString()));
      
    const now = Date.now().toString();
    
    if (existingProf) {
      // Update existing
      const correctCount = isCorrect 
        ? (parseInt(existingProf.correctCount) + 1).toString()
        : existingProf.correctCount;
        
      const attemptCount = (parseInt(existingProf.attemptCount) + 1).toString();
      
      const [updated] = await db.update(wordProficiency)
        .set({
          correctCount,
          attemptCount,
          lastPracticed: now
        })
        .where(eq(wordProficiency.id, existingProf.id))
        .returning();
        
      return updated;
    } else {
      // Create new
      const [newProf] = await db.insert(wordProficiency)
        .values({
          wordId: wordId.toString(),
          correctCount: isCorrect ? "1" : "0",
          attemptCount: "1",
          lastPracticed: now
        })
        .returning();
        
      return newProf;
    }
  }

  async resetWordProficiency(wordId: number): Promise<void> {
    await db.delete(wordProficiency)
      .where(eq(wordProficiency.wordId, wordId.toString()));
  }
  
  // Chinese character dictionary methods
  async searchCharacters(query: string): Promise<Character[]> {
    if (!query || query.length === 0) {
      return await db.select().from(characters).limit(50);
    }
    
    // Search by character or pinyin
    return await db.select().from(characters).where(
      or(
        like(characters.character, `%${query}%`),
        like(characters.pinyin, `%${query}%`)
      )
    ).limit(100);
  }
  
  async getCharacter(id: number): Promise<Character | undefined> {
    const [char] = await db.select().from(characters).where(eq(characters.id, id));
    return char;
  }
  
  async getCharacterByValue(char: string): Promise<Character | undefined> {
    const [result] = await db.select().from(characters).where(eq(characters.character, char));
    return result;
  }
  
  async addCharacter(character: InsertCharacter): Promise<Character> {
    // Check if character already exists
    const existing = await this.getCharacterByValue(character.character);
    if (existing) {
      return existing;
    }
    
    // Add new character
    const [newChar] = await db.insert(characters)
      .values(character)
      .returning();
      
    return newChar;
  }
  
  async getCharacterDefinitions(characterId: number): Promise<CharacterDefinition[]> {
    return await db.select()
      .from(characterDefinitions)
      .where(eq(characterDefinitions.characterId, characterId))
      .orderBy(asc(characterDefinitions.order));
  }
  
  async addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition> {
    const [newDef] = await db.insert(characterDefinitions)
      .values(definition)
      .returning();
      
    return newDef;
  }
  
  async updateCharacterDefinition(id: number, updates: Partial<InsertCharacterDefinition>): Promise<CharacterDefinition> {
    const [updated] = await db.update(characterDefinitions)
      .set(updates)
      .where(eq(characterDefinitions.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Definition with ID ${id} not found`);
    }
    
    return updated;
  }
  
  async deleteCharacterDefinition(id: number): Promise<void> {
    await db.delete(characterDefinitions).where(eq(characterDefinitions.id, id));
  }
  
  // User learned definitions methods
  async getLearnedDefinitions(userId: number): Promise<LearnedDefinition[]> {
    return await db.select()
      .from(learnedDefinitions)
      .where(eq(learnedDefinitions.userId, userId));
  }
  
  async toggleLearnedDefinition(userId: number, definitionId: number, isLearned: boolean): Promise<LearnedDefinition> {
    // Check if record exists
    const [existing] = await db.select()
      .from(learnedDefinitions)
      .where(
        and(
          eq(learnedDefinitions.userId, userId),
          eq(learnedDefinitions.definitionId, definitionId)
        )
      );
      
    if (existing) {
      // Update existing record
      const [updated] = await db.update(learnedDefinitions)
        .set({ isLearned })
        .where(eq(learnedDefinitions.id, existing.id))
        .returning();
        
      return updated;
    } else {
      // Create new record
      const [newLearned] = await db.insert(learnedDefinitions)
        .values({
          userId,
          definitionId,
          isLearned
        })
        .returning();
        
      return newLearned;
    }
  }
  
  async updateLearnedDefinitionNotes(id: number, notes: string): Promise<LearnedDefinition> {
    const [updated] = await db.update(learnedDefinitions)
      .set({ notes })
      .where(eq(learnedDefinitions.id, id))
      .returning();
      
    if (!updated) {
      throw new Error(`Learned definition with ID ${id} not found`);
    }
    
    return updated;
  }
}

// Use Database storage instead of MemStorage
export const storage = new DatabaseStorage();
