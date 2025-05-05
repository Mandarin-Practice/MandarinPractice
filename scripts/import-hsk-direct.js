// Import HSK and Integrated Chinese vocabulary using direct SQL queries
// This is more reliable than using ORM for bulk operations

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// HSK Level 1 vocabulary (sample)
const hskLevel1Words = [
  { word: '爱', pinyin: 'ai4', definition: 'to love' },
  { word: '八', pinyin: 'ba1', definition: 'eight' },
  { word: '爸爸', pinyin: 'ba4 ba5', definition: 'father' },
  { word: '杯子', pinyin: 'bei1 zi5', definition: 'cup' },
  { word: '北京', pinyin: 'Bei3 jing1', definition: 'Beijing' },
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
  // Add more as needed
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
  // Add more as needed
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
  // Add more as needed
];

// Add a character or update its HSK level
async function addOrUpdateCharacter(word, pinyin, hskLevel) {
  const client = await pool.connect();
  
  try {
    // Check if character exists
    const checkResult = await client.query(
      'SELECT id, "hsk_level" FROM characters WHERE character = $1',
      [word]
    );
    
    if (checkResult.rows.length > 0) {
      // Character exists, update HSK level if needed
      const existingChar = checkResult.rows[0];
      if (existingChar.hsk_level === null || (hskLevel !== null && hskLevel < existingChar.hsk_level)) {
        await client.query(
          'UPDATE characters SET "hsk_level" = $1 WHERE id = $2',
          [hskLevel, existingChar.id]
        );
        console.log(`Updated HSK level for "${word}" to ${hskLevel}`);
      }
      return existingChar.id;
    } else {
      // Character doesn't exist, insert it
      const insertResult = await client.query(
        'INSERT INTO characters (character, pinyin, "hsk_level") VALUES ($1, $2, $3) RETURNING id',
        [word, pinyin, hskLevel]
      );
      console.log(`Added new character: "${word}" (HSK ${hskLevel})`);
      return insertResult.rows[0].id;
    }
  } catch (error) {
    console.error(`Error adding/updating character "${word}":`, error);
    return null;
  } finally {
    client.release();
  }
}

// Add definition if it doesn't exist
async function addDefinitionIfNeeded(characterId, definition) {
  const client = await pool.connect();
  
  try {
    // Get existing definitions
    const existingDefs = await client.query(
      'SELECT definition FROM character_definitions WHERE character_id = $1',
      [characterId]
    );
    
    // Check if similar definition exists
    let hasSimilarDefinition = false;
    for (const row of existingDefs.rows) {
      const existingDef = row.definition.toLowerCase();
      const newDef = definition.toLowerCase();
      
      if (existingDef.includes(newDef) || newDef.includes(existingDef)) {
        hasSimilarDefinition = true;
        break;
      }
    }
    
    if (!hasSimilarDefinition) {
      // Get max order
      const orderResult = await client.query(
        'SELECT COALESCE(MAX("order"), 0) as max_order FROM character_definitions WHERE character_id = $1',
        [characterId]
      );
      const nextOrder = (orderResult.rows[0].max_order || 0) + 1;
      
      // Add new definition
      const result = await client.query(
        'INSERT INTO character_definitions (character_id, definition, "order") VALUES ($1, $2, $3) RETURNING id',
        [characterId, definition, nextOrder]
      );
      return result.rows[0].id;
    }
    
    return null;
  } catch (error) {
    console.error(`Error adding definition for character ID ${characterId}:`, error);
    return null;
  } finally {
    client.release();
  }
}

// Main import function
async function importHSKAndICVocabulary() {
  try {
    console.log('Starting import of HSK and Integrated Chinese vocabulary...');
    
    // Import HSK Level 1
    console.log(`Processing HSK Level 1 vocabulary (${hskLevel1Words.length} words)...`);
    for (const wordData of hskLevel1Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 1);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import HSK Level 2
    console.log(`Processing HSK Level 2 vocabulary (${hskLevel2Words.length} words)...`);
    for (const wordData of hskLevel2Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 2);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import Integrated Chinese
    console.log(`Processing Integrated Chinese vocabulary (${integratedChineseWords.length} words)...`);
    for (const wordData of integratedChineseWords) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, null);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    console.log('Finished importing HSK and Integrated Chinese vocabulary!');
    
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
    console.log('HSK and Integrated Chinese vocabulary import completed successfully');
  } else {
    console.error('HSK and Integrated Chinese vocabulary import failed');
  }
});