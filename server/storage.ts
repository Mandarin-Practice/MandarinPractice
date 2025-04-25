import { vocabulary, type Vocabulary, type InsertVocabulary } from "@shared/schema";

// Interface for CRUD operations on vocabulary
export interface IStorage {
  getAllVocabulary(): Promise<Vocabulary[]>;
  getVocabulary(id: number): Promise<Vocabulary | undefined>;
  addVocabulary(word: InsertVocabulary): Promise<Vocabulary>;
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
    const id = this.currentVocabularyId++;
    const newWord: Vocabulary = { ...word, id };
    this.vocabulary.set(id, newWord);
    return newWord;
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
