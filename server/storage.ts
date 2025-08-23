import { 
  type InsertFullProficiency, 
  type Vocabulary, 
  type CharacterDefinition,
  type InsertCharacterDefinition,
  type User,
  type InsertUser,
  characterDefinitions,
  wordProficiency,
  users,
  Proficiency,
  FullProficiency,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, desc, asc, and, or, sql, inArray, not } from "drizzle-orm";
import { convertNumericPinyinToTonal, isNumericPinyin } from './utils/pinyin-converter';
import { check } from "drizzle-orm/mysql-core";

// setInterval(() => {
//   console.log(`📊 Pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
// }, 5000);

// setInterval(() => {
//   console.log(`📊 Pool status: ${pool.totalCount} total, ${pool.idleCount} idle, ${pool.waitingCount} waiting`);
// }, 5000);

// Interface for CRUD operations on vocabulary
export interface IStorage {
  // User authentication methods
  getAllUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getLeaderboard(limit?: number): Promise<User[]>;

  // Joint Vocab + Proficiency getters
  getAllVocabularyWithProficiency(userId: number): Promise<FullProficiency[]>;
  getVocabularyWithProficiency(userId: number, wordId: number): Promise<FullProficiency | undefined>;
  getVocabularyWithProficiencyBatch(userId: number, wordIds: number[]): Promise<(FullProficiency)[]>;
  getVocabularyWithProficiencyByChinese(userId: number, chinese: string): Promise<FullProficiency | undefined>;
  
  // Vocabulary methods
  getAllVocabulary(userId: number): Promise<Vocabulary[]>;
  getVocabulary(userId: number, wordId: number): Promise<Vocabulary | undefined>;
  getVocabularyBatch(userId: number, wordIds: number[]): Promise<Vocabulary[]>;
  getVocabularyByChinese(userId: number, chinese: string): Promise<Vocabulary | undefined>;
  getVocabularyBatchByChinese(userId: number, words: string[]): Promise<Vocabulary[]>;
  updateVocabulary(userId: number, wordId: number, updates: Partial<Vocabulary>): Promise<Vocabulary>;
  addVocabulary(userId: number, word: Vocabulary): Promise<Vocabulary>;
  addVocabularyBatch(userId: number, words: Vocabulary[]): Promise<Vocabulary[]>;
  deleteVocabulary(userId: number, id: number): Promise<void>;
  deleteVocabularyByChinese(userId: number, chinese: string): Promise<void>;
  deleteAllVocabulary(userId: number): Promise<void>;
  
  // Word proficiency methods
  getWordProficiency(userId: number, wordId: number): Promise<Proficiency | undefined>;
  getWordProficiencyBatch(userId: number, wordIds: number[]): Promise<Proficiency[]>;
  updateWordProficiencyBatch(userId: number, proficiencyDiff: {wordId: number, isCorrect: boolean}[]): Promise<Proficiency[]>;
  updateWordProficiencyBatchByChinese(userId: number, chinesePinyinDiff: {chinese: string, isCorrect: boolean}[]): Promise<Proficiency[]>;
  getWordProficiencies(userId: number): Promise<Proficiency[]>;
  updateWordProficiency(userId: number, wordId: number, isCorrect: boolean): Promise<Proficiency>;
  removeWordProficiency(userId: number, wordId: number): Promise<void>;
  
  // Chinese character dictionary methods
  searchCharacterDefinitions(query: string): Promise<CharacterDefinition[]>;
  getCharacterDefinition(characters: string): Promise<CharacterDefinition[]>;
  addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition>;
  getCharacterCompounds(word: string): Promise<CharacterDefinition[]>;
  getCompoundComponents(word: string): Promise<CharacterDefinition[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User authentication methods
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    // Check if user already exists with the same firebase UID
    if (user.firebaseUid) {
      const existingUser = await this.getUserByFirebaseUid(user.firebaseUid);
      if (existingUser) {
        return existingUser;
      }
    }
    
    // Check if username is taken
    if (user.username) {
      const existingUser = await this.getUserByUsername(user.username);
      if (existingUser) {
        throw new Error("Username already exists");
      }
    }
    
    // Create the new user
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return updatedUser;
  }
  
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    try {
      // Get top users ordered by highest score
      const leaderboard = await db
        .select()
        .from(users)
        .orderBy(desc(users.highestScore))
        .limit(limit);
      
      return leaderboard;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  // Joint Vocab + Proficiency getters

  async getAllVocabularyWithProficiency(userId: number): Promise<FullProficiency[]> {
    return await db.select().from(wordProficiency).where(eq(wordProficiency.userId, userId));
  }

  async getVocabularyWithProficiency(userId: number, wordId: number): Promise<FullProficiency | undefined> {
    const [result] = await db.select()
      .from(wordProficiency)
      .where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, wordId)));

    return result;
  }

  async getVocabularyWithProficiencyBatch(userId: number, wordIds: number[]): Promise<FullProficiency[]> {
    return await db.select()
      .from(wordProficiency)
      .where(and(eq(wordProficiency.userId, userId), inArray(wordProficiency.id, wordIds)));
  }

  async getVocabularyWithProficiencyByChinese(userId: number, chinese: string): Promise<FullProficiency | undefined> {
    const [result] = await db.select()
      .from(wordProficiency)
      .where(
        and(
          eq(wordProficiency.userId, userId),
          eq(wordProficiency.chinese, chinese)
        )
      );

    return result;
  }

  // Vocabulary methods

  private readonly VOCABULARY_SELECT = {
    id: wordProficiency.id,
    chinese: wordProficiency.chinese,
    pinyin: wordProficiency.pinyin,
    english: wordProficiency.english,
    active: wordProficiency.active,
    category: wordProficiency.category
  };

  async getAllVocabulary(userId: number): Promise<Vocabulary[]> {
    return await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(eq(wordProficiency.userId, userId));
  }

  async getVocabulary(userId: number, wordId: number): Promise<Vocabulary | undefined> {
    const [vocab] = await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, wordId)));
    return vocab;
  }
  
  async getVocabularyByChinese(userId: number, chinese: string): Promise<Vocabulary | undefined> {
    const [vocab] = await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(
      and(
        eq(wordProficiency.userId, userId),
        eq(wordProficiency.chinese, chinese)
      )
    );
    return vocab;
  }

  async getVocabularyBatchByChinese(userId: number, words: string[]): Promise<Vocabulary[]> {
    const vocab = await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(
      and(
        eq(wordProficiency.userId, userId),
        inArray(wordProficiency.chinese, words)
      )
    );
    return vocab;
  }

  async getVocabularyBatchByChineseAndPinyin(userId: number, words: { chinese: string, pinyin: string }[]): Promise<Vocabulary[]> {
    const chinese = words.map(word => word.chinese);
    const pinyin = words.map(word => word.pinyin);
    const vocab = await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(
      and(
        eq(wordProficiency.userId, userId),
        inArray(wordProficiency.chinese, chinese),
        inArray(wordProficiency.pinyin, pinyin)
      )
    );
    return vocab;
  }

  async getVocabularyBatch(userId: number, wordIds: number[]): Promise<Vocabulary[]> {
    const vocab = await db.select(this.VOCABULARY_SELECT).from(wordProficiency).where(and(eq(wordProficiency.userId, userId), inArray(wordProficiency.id, wordIds)));
    return vocab;
  }

  async addVocabulary(userId: number, word: Vocabulary): Promise<Vocabulary> {
    // Add new word
    const [newVocab] = await db.insert(wordProficiency)
      .values({...word, userId: userId})
      .onConflictDoUpdate({
        target: [wordProficiency.userId, wordProficiency.chinese, wordProficiency.pinyin],
        set: {
          english: sql`excluded.english`,
          active: sql`excluded.active`,
          category: sql`excluded.category`
        }
      })
      .returning();
      
    return newVocab;
  }

  async addVocabularyBatch(userId: number, words: Vocabulary[]): Promise<Vocabulary[]> {
    console.log(`[IMPORT DEBUG] Received batch request for ${words.length} words at time ${new Date().getMinutes()}:${new Date().getSeconds()}`);
    
    if (words.length === 0) {
      return [];
    }
      
    try {
      const insertStart = Date.now();
      const insertedWords = await db.insert(wordProficiency)
        .values(words.map(word => ({...word, userId})))
        .onConflictDoUpdate({
          target: [wordProficiency.userId, wordProficiency.chinese, wordProficiency.pinyin],
          set: {
            english: sql`excluded.english`,
            active: sql`excluded.active`,
            category: sql`excluded.category`
          }
        })
        .returning();
      
      const insertTime = Date.now() - insertStart;
      console.log(`[IMPORT DEBUG] Insert operation took ${insertTime}ms for ${insertedWords.length} words`);
      
      return insertedWords;
    } catch (error) {
      console.error('[IMPORT DEBUG] Database error:', error);
      throw error;
    }
  }

  async updateVocabulary(userId: number, wordId: number, updates: Partial<Vocabulary>): Promise<Vocabulary> {
    return db.transaction(async (tx) => {
      const [updated] = await tx.update(wordProficiency)
        .set(updates)
        .where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, wordId)))
        .returning(this.VOCABULARY_SELECT);
        
      if (!updated) {
        throw new Error(`Vocabulary with ID ${wordId} not found for user ${userId}`);
      }
      
      return updated;
    });
  }

  async deleteVocabulary(userId: number, id: number): Promise<void> {
    await db.delete(wordProficiency).where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, id)));
  }

  async deleteVocabularyByChinese(userId: number, chinese: string): Promise<void> {
    await db.delete(wordProficiency).where(and(
      eq(wordProficiency.userId, userId),
      eq(wordProficiency.chinese, chinese)
    ));
  }

  async deleteAllVocabulary(userId: number): Promise<void> {
    await db.delete(wordProficiency).where(eq(wordProficiency.userId, userId));
  }

  // Word proficiency methods

  private readonly PROFICIENCY_SELECT = {
    id: wordProficiency.id,
    correctCount: wordProficiency.correctCount,
    attemptCount: wordProficiency.attemptCount,
    percentCorrect: wordProficiency.percentCorrect,
    lastPracticed: wordProficiency.lastPracticed
  };

  async getWordProficiency(userId: number, wordId: number): Promise<Proficiency | undefined> {
    const [proficiency] = await db.select(this.PROFICIENCY_SELECT).from(wordProficiency).where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, wordId)));

    return proficiency;
  }

  async getWordProficiencyBatch(userId: number, wordIds: number[]): Promise<Proficiency[]> {
    const proficiency = await db.select(this.PROFICIENCY_SELECT).from(wordProficiency)
      .where(and(eq(wordProficiency.userId, userId), inArray(wordProficiency.id, wordIds)));

    return proficiency;
  }
  
  async getWordProficiencies(userId: number): Promise<Proficiency[]> {
    return await db.select(this.PROFICIENCY_SELECT).from(wordProficiency)
      .where(eq(wordProficiency.userId, userId));
  }

  async updateWordProficiency(userId: number, wordId: number, isCorrect: boolean): Promise<Proficiency> {
    const [updated] = await db.update(wordProficiency).set({
      correctCount: sql`${wordProficiency.correctCount} + ${isCorrect ? 1 : 0}`,
      attemptCount: sql`${wordProficiency.attemptCount} + 1`,
      lastPracticed: new Date()}).where(and(eq(wordProficiency.userId, userId), eq(wordProficiency.id, wordId)))
    .returning(this.PROFICIENCY_SELECT);
        
    return updated;
  }

  async updateWordProficiencyBatch(userId: number, proficiencyDiff: {wordId: number, isCorrect: boolean}[]): Promise<Proficiency[]> {
    return await db.transaction(async (tx) => {
      const updated: Proficiency[] = [];
      
      // Separate correct and incorrect answers
      const correctWordIds = proficiencyDiff.filter(d => d.isCorrect).map(d => d.wordId);
      const incorrectWordIds = proficiencyDiff.filter(d => !d.isCorrect).map(d => d.wordId);
      
      // Batch update correct answers
      if (correctWordIds.length > 0) {
        const correctUpdates = await tx.update(wordProficiency)
          .set({
            correctCount: sql`${wordProficiency.correctCount} + 1`,
            attemptCount: sql`${wordProficiency.attemptCount} + 1`,
            lastPracticed: new Date()
          })
          .where(and(
            eq(wordProficiency.userId, userId),
            inArray(wordProficiency.id, correctWordIds)
          ))
          .returning(this.PROFICIENCY_SELECT);
        
        updated.push(...correctUpdates);
      }
      
      // Batch update incorrect answers
      if (incorrectWordIds.length > 0) {
        const incorrectUpdates = await tx.update(wordProficiency)
          .set({
            attemptCount: sql`${wordProficiency.attemptCount} + 1`,
            lastPracticed: new Date()
          })
          .where(and(
            eq(wordProficiency.userId, userId),
            inArray(wordProficiency.id, incorrectWordIds)
          ))
          .returning(this.PROFICIENCY_SELECT);
        
        updated.push(...incorrectUpdates);
      }
      
      return updated;
    });
  }

  async updateWordProficiencyBatchByChinese(userId: number, proficiencyDiff: {chinese: string, isCorrect: boolean}[]): Promise<Proficiency[]> {
    const updated: Proficiency[] = [];
    
    // Separate correct and incorrect answers
    const correctWords = proficiencyDiff.filter(d => d.isCorrect).map(d => { return d.chinese });
    const incorrectWords = proficiencyDiff.filter(d => !d.isCorrect).map(d => { return d.chinese });
    
    // Batch update correct answers
    if (correctWords.length > 0) {
      const correctUpdates = await db.update(wordProficiency)
        .set({
          correctCount: sql`${wordProficiency.correctCount} + 1`,
          attemptCount: sql`${wordProficiency.attemptCount} + 1`,
          lastPracticed: new Date()
        })
        .where(and(
          eq(wordProficiency.userId, userId),
          inArray(wordProficiency.chinese, correctWords)
        ))
        .returning(this.PROFICIENCY_SELECT);
      
      updated.push(...correctUpdates);
    }
    
    // Batch update incorrect answers
    if (incorrectWords.length > 0) {
      const incorrectUpdates = await db.update(wordProficiency)
        .set({
          attemptCount: sql`${wordProficiency.attemptCount} + 1`,
          lastPracticed: new Date()
        })
        .where(and(
          eq(wordProficiency.userId, userId),
          inArray(wordProficiency.chinese, incorrectWords)
        ))
        .returning(this.PROFICIENCY_SELECT);
      
      updated.push(...incorrectUpdates);
    }
    
    return updated;
  }
  
  async removeWordProficiency(userId: number, wordId: number): Promise<void> {
      await db.delete(wordProficiency)
        .where(and(eq(wordProficiency.id, wordId), eq(wordProficiency.userId, userId)));
  }
  
  // Chinese character dictionary methods
  async searchCharacterDefinitions(query: string): Promise<CharacterDefinition[]> {
    const chineseCharRegex = /^[\u4e00-\u9fff]+$/;
    
    if (chineseCharRegex.test(query)) {
      const matches = await db.select()
        .from(characterDefinitions)
        .where(like(characterDefinitions.characters, query))
        .orderBy(sql`length(${characterDefinitions.characters})`);

      return matches;
    }

    // Regular search by definition if not a priority term or no priority matches
    const charactersWithMatchingDefinitions = await db.select()
      .from(characterDefinitions)
      .where(like(characterDefinitions.definition, `%${query}%`));

    return charactersWithMatchingDefinitions;
  }
  
  /**
   * Helper method to convert numeric pinyin to tonal pinyin for display
   * This doesn't modify the database, only formats the results for the client
   */
  private formatPinyinForCharacters(chars: Vocabulary[]): Vocabulary[] {
    return chars.map(char => {
      if (!char.pinyin) return char;
      
      // Convert numeric pinyin to tonal pinyin if needed
      let formattedPinyin = isNumericPinyin(char.pinyin) 
        ? convertNumericPinyinToTonal(char.pinyin)
        : char.pinyin;
      
      // Also handle 'v' as 'ü' in pinyin without tone numbers
      if (!isNumericPinyin(formattedPinyin)) {
        formattedPinyin = formattedPinyin.replace(/\b(l|n)v\b/g, '$1ü'); // lv, nv
        formattedPinyin = formattedPinyin.replace(/\b(l|n)ve\b/g, '$1üe'); // lve, nve
        formattedPinyin = formattedPinyin.replace(/\bju\b/g, 'jü'); // ju -> jü
        formattedPinyin = formattedPinyin.replace(/\bqu\b/g, 'qü'); // qu -> qü
        formattedPinyin = formattedPinyin.replace(/\bxu\b/g, 'xü'); // xu -> xü
        formattedPinyin = formattedPinyin.replace(/\byv\b/g, 'yü'); // yv -> yü (rare)
      }
      
      return {
        ...char,
        pinyin: formattedPinyin
      };
    });
  }
  
  async getCharacterDefinition(characters: string): Promise<CharacterDefinition[]> {
    return await db.select()
      .from(characterDefinitions)
      .where(eq(characterDefinitions.characters, characters));
  }
  
  async addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition> {
    const [newDef] = await db.insert(characterDefinitions)
      .values(definition)
      .returning();
      
    return newDef;
  }
  
  // Character compound relationship methods
  async getCharacterCompounds(characters: string): Promise<CharacterDefinition[]> {
    try {
      // Get all compounds where this character is a component
      const result = await db.select()
        .from(characterDefinitions)
        .where(like(characterDefinitions.characters, `%${characters}%`));
            
      return result;
    } catch (error) {
      console.error('Error getting character compounds:', error);
      return [];
    }
  }
  
  async getCompoundComponents(characters: string): Promise<CharacterDefinition[]> {
    try {      
      return await db.select()
        .from(characterDefinitions)
        .where(inArray(characterDefinitions.characters, characters.split('')));
    } catch (error) {
      console.error('Error getting compound components:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
