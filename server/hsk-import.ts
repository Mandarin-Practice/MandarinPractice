// Import HSK vocabulary and Integrated Chinese textbook vocabulary
// This TypeScript script updates the database with HSK level information for existing characters
// and adds any missing HSK and Integrated Chinese vocabulary

import { pool, db } from './db';
import { characters, characterDefinitions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// HSK Level 1 vocabulary (150 words)
const hskLevel1Words = [
  { word: '爱', pinyin: 'ai4', definition: 'to love' },
  { word: '八', pinyin: 'ba1', definition: 'eight' },
  { word: '爸爸', pinyin: 'ba4 ba5', definition: 'father' },
  { word: '杯子', pinyin: 'bei1 zi5', definition: 'cup' },
  { word: '北京', pinyin: 'bei3 jing1', definition: 'Beijing' },
  { word: '本', pinyin: 'ben3', definition: 'measure word for books, etc.' },
  { word: '不客气', pinyin: 'bu4 ke4 qi5', definition: "you're welcome" },
  { word: '不', pinyin: 'bu4', definition: 'no, not' },
  { word: '菜', pinyin: 'cai4', definition: 'dish, vegetable' },
  { word: '茶', pinyin: 'cha2', definition: 'tea' },
  { word: '吃', pinyin: 'chi1', definition: 'to eat' },
  { word: '出租车', pinyin: 'chu1 zu1 che1', definition: 'taxi' },
  { word: '打电话', pinyin: 'da3 dian4 hua4', definition: 'to make a phone call' },
  { word: '大', pinyin: 'da4', definition: 'big, large' },
  { word: '的', pinyin: 'de5', definition: 'possessive particle' },
  { word: '点', pinyin: 'dian3', definition: 'o`clock, point' },
  { word: '电脑', pinyin: 'dian4 nao3', definition: 'computer' },
  { word: '电视', pinyin: 'dian4 shi4', definition: 'television' },
  { word: '电影', pinyin: 'dian4 ying3', definition: 'movie' },
  { word: '东西', pinyin: 'dong1 xi5', definition: 'thing, stuff' },
  { word: '都', pinyin: 'dou1', definition: 'all, both' },
  { word: '读', pinyin: 'du2', definition: 'to read' },
  { word: '对不起', pinyin: 'dui4 bu5 qi3', definition: 'sorry' },
  { word: '多', pinyin: 'duo1', definition: 'many, much, more' },
  { word: '多少', pinyin: 'duo1 shao5', definition: 'how many, how much' },
  // Add more HSK 1 words as needed
];

// HSK Level 2 vocabulary (sample)
const hskLevel2Words = [
  { word: '啊', pinyin: 'a5', definition: 'interjection of surprise' },
  { word: '阿姨', pinyin: 'a1 yi2', definition: 'aunt' },
  { word: '矮', pinyin: 'ai3', definition: 'short (height)' },
  { word: '爱好', pinyin: 'ai4 hao4', definition: 'hobby' },
  { word: '安静', pinyin: 'an1 jing4', definition: 'quiet' },
  { word: '把', pinyin: 'ba3', definition: 'to hold, to take' },
  { word: '班', pinyin: 'ban1', definition: 'class' },
  { word: '搬', pinyin: 'ban1', definition: 'to move, to carry' },
  { word: '办法', pinyin: 'ban4 fa3', definition: 'way, method' },
  { word: '办公室', pinyin: 'ban4 gong1 shi4', definition: 'office' },
  // Add more HSK 2 words as needed
];

// Integrated Chinese Vocabulary (sample)
const integratedChineseWords = [
  { word: '你好', pinyin: 'ni3 hao3', definition: 'hello' },
  { word: '谢谢', pinyin: 'xie4 xie5', definition: 'thank you' },
  { word: '再见', pinyin: 'zai4 jian4', definition: 'goodbye' },
  { word: '请问', pinyin: 'qing3 wen4', definition: 'may I ask' },
  { word: '对不起', pinyin: 'dui4 bu5 qi3', definition: 'sorry' },
  { word: '没关系', pinyin: 'mei2 guan1 xi5', definition: "it's okay" },
  { word: '老师', pinyin: 'lao3 shi1', definition: 'teacher' },
  { word: '学生', pinyin: 'xue2 sheng5', definition: 'student' },
  { word: '同学', pinyin: 'tong2 xue2', definition: 'classmate' },
  { word: '朋友', pinyin: 'peng2 you5', definition: 'friend' },
  // Add more IC words as needed
];

// Helper function to create a character if it doesn't exist
async function addOrUpdateCharacter(character: string, pinyin: string, hskLevel: number | null) {
  try {
    // Check if the character exists
    const existingResult = await db.select()
      .from(characters)
      .where(eq(characters.character, character));
    
    if (existingResult.length > 0) {
      // Character exists, update HSK level if needed
      const existingChar = existingResult[0];
      if (!existingChar.hskLevel || (hskLevel !== null && hskLevel < (existingChar.hskLevel || 99))) {
        // Update with the lower HSK level (lower is more common/basic)
        await db.update(characters)
          .set({ hskLevel: hskLevel })
          .where(eq(characters.id, existingChar.id));
        // console.log(`Updated HSK level for ${character} to ${hskLevel}`);
      }
      return existingChar.id;
    } else {
      // Character doesn't exist, insert it
      const [newChar] = await db.insert(characters)
        .values({
          character: character,
          pinyin: pinyin,
          hskLevel: hskLevel,
        })
        .returning();
      // console.log(`Added new character: ${character} (HSK ${hskLevel})`);
      return newChar.id;
    }
  } catch (error) {
    console.error(`Error adding/updating character ${character}:`, error);
    return null;
  }
}

// Add definition for character if it doesn't already have one
async function addDefinitionIfNeeded(characterId: number, definition: string) {
  try {
    // Check if a similar definition already exists
    const existingDefinitions = await db.select()
      .from(characterDefinitions)
      .where(eq(characterDefinitions.characterId, characterId));
    
    // If no definitions or no similar definition, add this one
    if (existingDefinitions.length === 0 || 
        !existingDefinitions.some(def => 
          def.definition.toLowerCase().includes(definition.toLowerCase()) || 
          definition.toLowerCase().includes(def.definition.toLowerCase())
        )) {
      const [newDef] = await db.insert(characterDefinitions)
        .values({
          characterId: characterId,
          definition: definition,
          order: existingDefinitions.length + 1,
        })
        .returning();
      return newDef.id;
    }
    return null;
  } catch (error) {
    console.error(`Error adding definition for character ID ${characterId}:`, error);
    return null;
  }
}

// Process each word list
async function importHSKAndICVocabulary() {
  try {
    // console.log('Starting import of HSK and Integrated Chinese vocabulary...');
    
    // Import HSK Level 1 vocabulary
    // console.log(`Processing HSK Level 1 vocabulary (${hskLevel1Words.length} words)...`);
    for (const wordData of hskLevel1Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 1);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import HSK Level 2 vocabulary
    // console.log(`Processing HSK Level 2 vocabulary (${hskLevel2Words.length} words)...`);
    for (const wordData of hskLevel2Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 2);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import Integrated Chinese vocabulary
    // console.log(`Processing Integrated Chinese vocabulary (${integratedChineseWords.length} words)...`);
    for (const wordData of integratedChineseWords) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, null);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // console.log('Finished importing HSK and Integrated Chinese vocabulary!');
    
    return true;
  } catch (error) {
    console.error('Error importing HSK and IC vocabulary:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the import
importHSKAndICVocabulary().then(success => {
  if (success) {
    // console.log('HSK and Integrated Chinese vocabulary import completed successfully');
    process.exit(0);
  } else {
    console.error('HSK and Integrated Chinese vocabulary import failed');
    process.exit(1);
  }
});