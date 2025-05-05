import { vocabulary, type Vocabulary, type InsertVocabulary, type WordProficiency, type InsertWordProficiency } from "@shared/schema";

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
}

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
    // Check if a word with the same Chinese, pinyin, and English already exists
    const existingWords = Array.from(this.vocabulary.values());
    
    // First check for exact match (all three fields)
    const exactDuplicate = existingWords.find(
      existing => 
        existing.chinese === word.chinese && 
        existing.pinyin === word.pinyin && 
        existing.english === word.english
    );
    
    // If exact duplicate found, return it without adding a new one
    if (exactDuplicate) {
      console.log(`Found exact duplicate: ${word.chinese} (${word.pinyin}) - ${word.english}`);
      // Set the active status to "true" if it wasn't already
      if (exactDuplicate.active !== "true") {
        exactDuplicate.active = "true";
        this.vocabulary.set(exactDuplicate.id, exactDuplicate);
      }
      return exactDuplicate;
    }
    
    // Also check for a duplicate with same Chinese character, which is the most important check
    const chineseDuplicate = existingWords.find(
      existing => existing.chinese === word.chinese
    );
    
    // If Chinese character duplicate found, update it with merged information
    if (chineseDuplicate) {
      console.log(`Merging Chinese character duplicate: ${word.chinese}`);
      
      // Only update fields if the new word has better data
      // For example, if the existing word has empty pinyin or english, use the new word's values
      const updatedWord: Vocabulary = { 
        ...chineseDuplicate,
        // Use new pinyin if existing is empty
        pinyin: chineseDuplicate.pinyin || word.pinyin,
        // Use new english if existing is empty
        english: chineseDuplicate.english || word.english,
        // Always set active to true for merged words
        active: "true"
      };
      
      this.vocabulary.set(chineseDuplicate.id, updatedWord);
      return updatedWord;
    }
    
    // Otherwise, add as a new word
    const id = this.currentVocabularyId++;
    // Set default active status if not provided
    const newWord: Vocabulary = { 
      ...word, 
      id,
      active: word.active || "true" 
    };
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
    if (!this.vocabulary.has(id)) {
      throw new Error(`Vocabulary with ID ${id} not found`);
    }
    this.vocabulary.delete(id);
  }

  async deleteAllVocabulary(): Promise<void> {
    this.vocabulary.clear();
  }

  // Word proficiency methods
  async getWordProficiency(wordId: number): Promise<WordProficiency | undefined> {
    // Check if proficiency record exists for this word, if not create a new one
    const existingProf = Array.from(this.wordProficiency.values()).find(
      prof => Number(prof.wordId) === wordId
    );

    if (existingProf) {
      return existingProf;
    }

    // If no proficiency data found, return undefined
    return undefined;
  }

  async updateWordProficiency(wordId: number, isCorrect: boolean): Promise<WordProficiency> {
    // Find existing proficiency record or create a new one
    let proficiency = Array.from(this.wordProficiency.values()).find(
      p => Number(p.wordId) === wordId
    );

    const now = Date.now().toString();

    if (!proficiency) {
      // Create new proficiency record
      const id = this.currentProficiencyId++;
      proficiency = {
        id,
        wordId: wordId.toString(),
        correctCount: isCorrect ? "1" : "0",
        attemptCount: "1",
        lastPracticed: now
      };
      this.wordProficiency.set(id, proficiency);
    } else {
      // Update existing record
      const correctCount = isCorrect 
        ? (Number(proficiency.correctCount) + 1).toString() 
        : proficiency.correctCount;
      
      const attemptCount = (Number(proficiency.attemptCount) + 1).toString();

      proficiency = {
        ...proficiency,
        correctCount,
        attemptCount,
        lastPracticed: now
      };

      this.wordProficiency.set(proficiency.id, proficiency);
    }

    return proficiency;
  }

  async resetWordProficiency(wordId: number): Promise<void> {
    // Find the proficiency record and remove it
    const proficiency = Array.from(this.wordProficiency.values()).find(
      p => Number(p.wordId) === wordId
    );

    if (proficiency) {
      this.wordProficiency.delete(proficiency.id);
    }
  }
}

export const storage = new MemStorage();
