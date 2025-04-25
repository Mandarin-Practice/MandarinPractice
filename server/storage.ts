import { vocabulary, type Vocabulary, type InsertVocabulary } from "@shared/schema";

// Interface for CRUD operations on vocabulary
export interface IStorage {
  getAllVocabulary(): Promise<Vocabulary[]>;
  getVocabulary(id: number): Promise<Vocabulary | undefined>;
  addVocabulary(word: InsertVocabulary): Promise<Vocabulary>;
  updateVocabulary(id: number, updates: Partial<InsertVocabulary>): Promise<Vocabulary>;
  deleteVocabulary(id: number): Promise<void>;
  deleteAllVocabulary(): Promise<void>;
}

export class MemStorage implements IStorage {
  private vocabulary: Map<number, Vocabulary>;
  private currentVocabularyId: number;

  constructor() {
    this.vocabulary = new Map();
    this.currentVocabularyId = 1;
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
      console.log(`Skipping exact duplicate: ${word.chinese} (${word.pinyin}) - ${word.english}`);
      return exactDuplicate;
    }
    
    // Also check for a duplicate with same Chinese character, which is the most important check
    const chineseDuplicate = existingWords.find(
      existing => existing.chinese === word.chinese
    );
    
    // If Chinese character duplicate found, return it without adding a new one
    if (chineseDuplicate) {
      console.log(`Skipping Chinese character duplicate: ${word.chinese}`);
      return chineseDuplicate;
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
}

export const storage = new MemStorage();
