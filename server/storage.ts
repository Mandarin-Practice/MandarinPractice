import { 
  type InsertFullProficiency, 
  type Vocabulary, 
  type Character,
  type InsertCharacter,
  type CharacterDefinition,
  type InsertCharacterDefinition,
  type LearnedDefinition,
  type InsertLearnedDefinition,
  type CharacterCompound,
  type InsertCharacterCompound,
  type User,
  type InsertUser,
  characters,
  characterDefinitions,
  learnedDefinitions,
  characterCompounds,
  wordProficiency,
  users,
  Proficiency,
  FullProficiency
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
  searchCharacters(query: string): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  getCharacterByValue(char: string): Promise<Character | undefined>;
  addCharacter(character: InsertCharacter): Promise<Character>;
  getCharacterDefinitions(characterId: number): Promise<CharacterDefinition[]>;
  addCharacterDefinition(definition: InsertCharacterDefinition): Promise<CharacterDefinition>;
  updateCharacterDefinition(id: number, updates: Partial<InsertCharacterDefinition>): Promise<CharacterDefinition>;
  deleteCharacterDefinition(id: number): Promise<void>;
  
  // Character compound relationships methods
  getCharacterCompounds(componentId: number): Promise<{ compound: Character, position: number }[]>;
  getCompoundComponents(compoundId: number): Promise<{ component: Character, position: number }[]>;
  
  // User learned definitions methods
  getLearnedDefinitions(userId: number): Promise<LearnedDefinition[]>;
  toggleLearnedDefinition(userId: number, definitionId: number, isLearned: boolean): Promise<LearnedDefinition>;
  updateLearnedDefinitionNotes(id: number, notes: string): Promise<LearnedDefinition>;
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
  async searchCharacters(query: string): Promise<Character[]> {
    // Regular expression for valid Chinese characters
    const chineseCharRegex = /^[\u4e00-\u9fff]+$/;
    
    if (!query || query.length === 0) {
      // First get HSK vocabulary sorted by HSK level
      const hskResults = await db.select()
        .from(characters)
        .where(
          and(
            sql`characters.character ~ '^[\u4e00-\u9fff]+$' AND characters.character !~ '[龥-鿋]+'`,
            sql`characters."hsk_level" IS NOT NULL`
          )
        )
        .orderBy(asc(characters.hskLevel));
      
      // Then get other characters sorted by frequency
      const otherResults = await db.select()
        .from(characters)
        .where(
          and(
            sql`characters.character ~ '^[\u4e00-\u9fff]+$' AND characters.character !~ '[龥-鿋]+'`,
            sql`characters."hsk_level" IS NULL`
          )
        )
        .orderBy(asc(characters.frequency));
      
      // Combine results with HSK vocabulary first
      const combinedResults = [...hskResults, ...otherResults];
      
      // Convert numeric pinyin to tonal pinyin for display
      return this.formatPinyinForCharacters(combinedResults);
    }
    
    // If the query is exactly a Chinese character, prioritize exact matches
    if (query.length === 1 && chineseCharRegex.test(query)) {
      const exactMatches = await db.select()
        .from(characters)
        .where(eq(characters.character, query));
      
      if (exactMatches.length > 0) {
        // Return the exact match only for a direct character search
        return this.formatPinyinForCharacters(exactMatches);
      }
    }
    
    // Special handling for common searches
    const commonSearchTerms: Record<string, string[]> = {
      // Basic elements and parts
      "water": ["水"],
      "fire": ["火"],
      "earth": ["土"],
      "wood": ["木"],
      "metal": ["金"],
      "person": ["人"],
      "mouth": ["口"],
      "heart": ["心"],
      "sun": ["日"],
      "moon": ["月"],
      "mountain": ["山"],
      "river": ["河"],
      "tree": ["树", "木"],
      "door": ["门"],
      "hand": ["手"],
      "eye": ["眼"],
      "ear": ["耳"],
      "nose": ["鼻"],
      "tongue": ["舌"],
      "foot": ["脚"],
      "head": ["头"],
      
      // Common pronouns and verbs from vocabulary 
      "i": ["我"],
      "me": ["我"],
      "you": ["你"],
      "he": ["他"],
      "she": ["她"],
      "it": ["它"],
      "we": ["我们"],
      "they": ["他们", "她们"],
      "eat": ["吃"],
      "drink": ["喝"],
      "go": ["去"],
      "come": ["来"],
      "see": ["看"],
      "look": ["看"],
      "listen": ["听"],
      "speak": ["说"],
      "talk": ["说话"],
      "write": ["写"],
      "read": ["念", "读"],
      "study": ["学习", "学"],
      "learn": ["学", "学习"],
      "teach": ["教"],
      "understand": ["懂"],
      "know": ["知道"],
      "think": ["想"],
      "thank": ["谢谢"],
      "sorry": ["对不起"],
      "goodbye": ["再见"],
      "hello": ["你好"],
      "good": ["好"],
      "bad": ["不好"],
      "many": ["多"],
      "few": ["少"],
      "easy": ["容易"],
      "difficult": ["难"],
      "slow": ["慢"],
      "fast": ["快"],
      "early": ["早"],
      "late": ["晚"],
      "sleep": ["睡觉", "睡"],
      "ask": ["请"],
      "please": ["请"],
      "walk": ["走"],
      "run": ["跑"],
      "fly": ["飞"],
      "swim": ["游泳"],
      "like": ["喜欢"],
      "love": ["爱"],
      "call": ["打电话"],
      "text": ["发短信"],
      "drive": ["开车"],
      "ride": ["骑车"],
      "rest": ["休息"],
      
      // Common nouns and other vocabulary
      "paper": ["纸"],
      "pen": ["笔"],
      "character": ["字", "汉字"],
      "word": ["词", "单词"],
      "language": ["语言"],
      "grammar": ["语法"],
      "class": ["课"],
      "homework": ["功课"],
      "handsome": ["帅"],
      "cool": ["酷"],
      "lesson text": ["课文"],
      "work": ["工作"],
      "job": ["工作"],
      "teacher": ["老师"],
      "friend": ["朋友"],
      "home": ["家"],
      "school": ["学校"],
      "computer": ["电脑"],
      "phone": ["手机"],
      "time": ["时间"],
      "today": ["今天"],
      "tomorrow": ["明天"],
      "yesterday": ["昨天"],
      "student": ["学生"],
      
      // Food and drink
      "rice": ["米饭", "饭"],
      "noodles": ["面条"],
      "fruit": ["水果"],
      "meat": ["肉"],
      "chicken": ["鸡"],
      "beef": ["牛肉"],
      "pork": ["猪肉"],
      "fish": ["鱼"],
      "tea": ["茶"],
      "coffee": ["咖啡"],
      "milk": ["牛奶"],
      "beer": ["啤酒"],
      
      // Colors
      "red": ["红"],
      "blue": ["蓝"],
      "green": ["绿"],
      "yellow": ["黄"],
      "black": ["黑"],
      "white": ["白"],
      "pink": ["粉"],
      "orange": ["橙"],
      
      // Numbers and time
      "one": ["一"],
      "two": ["二"],
      "three": ["三"],
      "four": ["四"],
      "five": ["五"],
      "six": ["六"],
      "seven": ["七"],
      "eight": ["八"],
      "nine": ["九"],
      "ten": ["十"],
      "hundred": ["百"],
      "thousand": ["千"],
      "week": ["星期"],
      "minute": ["分钟"],
      "hour": ["小时"],
      "day": ["天"],
      "month": ["月"],
      "year": ["年"],
      
      // Family
      "father": ["爸爸"],
      "mother": ["妈妈"],
      "dad": ["爸爸"],
      "mom": ["妈妈"],
      "brother": ["哥哥", "弟弟"],
      "sister": ["姐姐", "妹妹"],
      "older brother": ["哥哥"],
      "younger brother": ["弟弟"],
      "older sister": ["姐姐"],
      "younger sister": ["妹妹"],
      "grandfather": ["爷爷"],
      "grandmother": ["奶奶"],
      "child": ["孩子"],
      "son": ["儿子"],
      "daughter": ["女儿"],
      "wife": ["妻子"],
      
      // Transportation
      "car": ["汽车", "车"],
      "bicycle": ["自行车"],
      "train": ["火车"],
      "airplane": ["飞机"],
      "bus": ["公共汽车"],
      "subway": ["地铁"],
      "metro": ["地铁"],
      "taxi": ["出租车"]
    };
    
    // Check if this is a search for a common word
    const lowercaseQuery = query.toLowerCase();
    const priorityChars = commonSearchTerms[lowercaseQuery];
    
    // If this is a common search term, find those characters first
    if (priorityChars && priorityChars.length > 0) {
      const priorityResults = await db.select()
        .from(characters)
        .where(
          and(
            inArray(characters.character, priorityChars),
            sql`characters.character !~ '[龥-鿋]+'` // Only simplified Chinese characters
          )
        );
        
      if (priorityResults.length > 0) {
        // Get the rest of the results to append after the priority ones
        const charactersWithMatchingDefinitions = await db.select({
          characterId: characterDefinitions.characterId
        })
        .from(characterDefinitions)
        .where(like(characterDefinitions.definition, `%${query}%`))
        .groupBy(characterDefinitions.characterId);
        
        // Extract the characterIds into an array but exclude the priority ones
        const priorityIds = priorityResults.map(char => char.id);
        const characterIds = charactersWithMatchingDefinitions
          .map(result => result.characterId)
          .filter(id => !priorityIds.includes(id));
        
        // Get the rest of the results
        const otherResults = await db.select()
          .from(characters)
          .where(
            and(
              sql`characters.character ~ '^[\u4e00-\u9fff]+$' AND characters.character !~ '[龥-鿋]+'`, // Only return simplified Chinese characters
              or(
                and(
                  like(characters.character, `%${query}%`),
                  // Exclude the priority characters we already have
                  not(inArray(characters.character, priorityChars))
                ),
                and(
                  like(characters.pinyin, `%${query}%`),
                  // Exclude the priority characters we already have
                  not(inArray(characters.character, priorityChars))
                ),
                characterIds.length > 0 ? 
                  inArray(characters.id, characterIds) :
                  // If no matching definitions, this condition should be false but won't break the query
                  eq(sql`1`, sql`0`)
              )
            )
          )
          .orderBy(asc(characters.frequency));
          
        // Combine priority results with the rest
        const combinedResults = [...priorityResults, ...otherResults];
        
        // Convert numeric pinyin to tonal pinyin for display
        return this.formatPinyinForCharacters(combinedResults);
      }
    }
    
    // Regular search by definition if not a priority term or no priority matches
    const charactersWithMatchingDefinitions = await db.select({
      characterId: characterDefinitions.characterId
    })
    .from(characterDefinitions)
    .where(like(characterDefinitions.definition, `%${query}%`))
    .groupBy(characterDefinitions.characterId);
    
    // Extract the characterIds into an array
    const characterIds = charactersWithMatchingDefinitions.map(result => result.characterId);
    
    // Get HSK characters first that match the query
    const hskResults = await db.select()
      .from(characters)
      .where(
        and(
          sql`characters.character ~ '^[\u4e00-\u9fff]+$' AND characters.character !~ '[龥-鿋]+'`, // Only return simplified Chinese characters
          sql`characters."hsk_level" IS NOT NULL`,
          or(
            like(characters.character, `%${query}%`),
            like(characters.pinyin, `%${query}%`),
            characterIds.length > 0 ? 
              inArray(characters.id, characterIds) :
              // If no matching definitions, this condition should be false but won't break the query
              eq(sql`1`, sql`0`)
          )
        )
      )
      .orderBy(asc(characters.hskLevel));
    
    // Get non-HSK characters next
    const otherResults = await db.select()
      .from(characters)
      .where(
        and(
          sql`characters.character ~ '^[\u4e00-\u9fff]+$' AND characters.character !~ '[龥-鿋]+'`, // Only return simplified Chinese characters
          sql`characters."hsk_level" IS NULL`,
          or(
            like(characters.character, `%${query}%`),
            like(characters.pinyin, `%${query}%`),
            characterIds.length > 0 ? 
              inArray(characters.id, characterIds) :
              // If no matching definitions, this condition should be false but won't break the query
              eq(sql`1`, sql`0`)
          )
        )
      )
      .orderBy(asc(characters.frequency));
    
    // Combine results with HSK vocabulary first
    const combinedResults = [...hskResults, ...otherResults];
    
    // Convert numeric pinyin to tonal pinyin for display
    return this.formatPinyinForCharacters(combinedResults);
  }
  
  /**
   * Helper method to convert numeric pinyin to tonal pinyin for display
   * This doesn't modify the database, only formats the results for the client
   */
  private formatPinyinForCharacters(chars: Character[]): Character[] {
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
  
  async getCharacter(id: number): Promise<Character | undefined> {
    const [char] = await db.select().from(characters).where(eq(characters.id, id));
    if (char) {
      return this.formatPinyinForCharacters([char])[0];
    }
    return char;
  }
  
  async getCharacterByValue(char: string): Promise<Character | undefined> {
    const [result] = await db.select().from(characters).where(eq(characters.character, char));
    if (result) {
      return this.formatPinyinForCharacters([result])[0];
    }
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
  
  // Character compound relationship methods
  async getCharacterCompounds(componentId: number): Promise<{ compound: Character, position: number }[]> {
    try {
      // Get all compounds where this character is a component
      const result = await db.select({
        compound_id: characterCompounds.compoundId,
        position: characterCompounds.position,
      })
      .from(characterCompounds)
      .where(eq(characterCompounds.componentId, componentId))
      .orderBy(asc(characterCompounds.position));
      
      // If no compounds found, return empty array
      if (result.length === 0) return [];
      
      // Get the full compound character data for each compound ID
      const compoundData: { compound: Character, position: number }[] = [];
      
      for (const { compound_id, position } of result) {
        const [compound] = await db.select().from(characters)
          .where(eq(characters.id, compound_id));
          
        if (compound) {
          // Format pinyin before adding to result
          const formattedCompound = this.formatPinyinForCharacters([compound])[0];
          compoundData.push({ compound: formattedCompound, position });
        }
      }
      
      return compoundData;
    } catch (error) {
      console.error('Error getting character compounds:', error);
      return [];
    }
  }
  
  async getCompoundComponents(compoundId: number): Promise<{ component: Character, position: number }[]> {
    try {
      // Get all components of this compound
      const result = await db.select({
        component_id: characterCompounds.componentId,
        position: characterCompounds.position,
      })
      .from(characterCompounds)
      .where(eq(characterCompounds.compoundId, compoundId))
      .orderBy(asc(characterCompounds.position));
      
      // If no components found, return empty array
      if (result.length === 0) return [];
      
      // Get the full component character data for each component ID
      const componentData: { component: Character, position: number }[] = [];
      
      for (const { component_id, position } of result) {
        const [component] = await db.select().from(characters)
          .where(eq(characters.id, component_id));
          
        if (component) {
          // Format pinyin before adding to result
          const formattedComponent = this.formatPinyinForCharacters([component])[0];
          componentData.push({ component: formattedComponent, position });
        }
      }
      
      return componentData;
    } catch (error) {
      console.error('Error getting compound components:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
