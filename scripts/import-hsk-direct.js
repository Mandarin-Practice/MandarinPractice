// Import HSK and Integrated Chinese vocabulary using direct SQL queries
// This is more reliable than using ORM for bulk operations

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// HSK Level 3 vocabulary
const hskLevel3Words = [
  { word: '按时', pinyin: 'an4 shi2', definition: 'on time, punctually' },
  { word: '般', pinyin: 'ban1', definition: 'kind, type, sort' },
  { word: '搬', pinyin: 'ban1', definition: 'to move, to shift' },
  { word: '办法', pinyin: 'ban4 fa3', definition: 'way, method, solution' },
  { word: '半', pinyin: 'ban4', definition: 'half' },
  { word: '包', pinyin: 'bao1', definition: 'to wrap, package, bag' },
  { word: '报名', pinyin: 'bao4 ming2', definition: 'to sign up, to register' },
  { word: '北方', pinyin: 'bei3 fang1', definition: 'north, northern part' },
  { word: '被', pinyin: 'bei4', definition: 'by (passive marker)' },
  { word: '鼻子', pinyin: 'bi2 zi5', definition: 'nose' },
  { word: '比较', pinyin: 'bi3 jiao4', definition: 'rather, comparatively' },
  { word: '比赛', pinyin: 'bi3 sai4', definition: 'match, competition' },
  { word: '必须', pinyin: 'bi4 xu1', definition: 'must, have to' },
  { word: '变化', pinyin: 'bian4 hua4', definition: 'change, variation' },
  { word: '表示', pinyin: 'biao3 shi4', definition: 'to express, to show' },
  { word: '表演', pinyin: 'biao3 yan3', definition: 'to perform, performance' },
  { word: '别', pinyin: 'bie2', definition: 'don\'t, must not' },
  { word: '宾馆', pinyin: 'bin1 guan3', definition: 'hotel' },
  { word: '冰箱', pinyin: 'bing1 xiang1', definition: 'refrigerator' },
  { word: '不但', pinyin: 'bu4 dan4', definition: 'not only' },
  { word: '不过', pinyin: 'bu4 guo4', definition: 'but, however' },
  { word: '不管', pinyin: 'bu4 guan3', definition: 'regardless of, no matter what' },
  { word: '操场', pinyin: 'cao1 chang3', definition: 'playground, sports field' },
  { word: '草', pinyin: 'cao3', definition: 'grass, straw' },
  { word: '层', pinyin: 'ceng2', definition: 'layer, floor (of building)' },
  { word: '差不多', pinyin: 'cha4 bu5 duo1', definition: 'almost, nearly' },
  { word: '超市', pinyin: 'chao1 shi4', definition: 'supermarket' },
  { word: '衬衫', pinyin: 'chen4 shan1', definition: 'shirt' },
  { word: '成绩', pinyin: 'cheng2 ji4', definition: 'achievement, grade' },
  { word: '城市', pinyin: 'cheng2 shi4', definition: 'city, town' }
];

// HSK Level 1 vocabulary (extended)
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
  { word: '二', pinyin: 'er4', definition: 'two' },
  { word: '儿子', pinyin: 'er2 zi5', definition: 'son' },
  { word: '饭店', pinyin: 'fan4 dian4', definition: 'restaurant' },
  { word: '飞机', pinyin: 'fei1 ji1', definition: 'airplane' },
  { word: '分钟', pinyin: 'fen1 zhong1', definition: 'minute' },
  { word: '高兴', pinyin: 'gao1 xing4', definition: 'happy' },
  { word: '个', pinyin: 'ge4', definition: 'individual, general measure word' },
  { word: '工作', pinyin: 'gong1 zuo4', definition: 'work, job' },
  { word: '汉语', pinyin: 'Han4 yu3', definition: 'Chinese language' },
  { word: '好', pinyin: 'hao3', definition: 'good' },
  { word: '号', pinyin: 'hao4', definition: 'number, day of month' },
  { word: '喝', pinyin: 'he1', definition: 'to drink' },
  { word: '和', pinyin: 'he2', definition: 'and' },
  { word: '很', pinyin: 'hen3', definition: 'very' },
  { word: '后面', pinyin: 'hou4 mian5', definition: 'behind' },
  { word: '回', pinyin: 'hui2', definition: 'to return' },
  { word: '会', pinyin: 'hui4', definition: 'can, will, to be able to' },
  { word: '几', pinyin: 'ji3', definition: 'how many, several' },
  { word: '家', pinyin: 'jia1', definition: 'home, family' },
  { word: '叫', pinyin: 'jiao4', definition: 'to be called, to call' },
  { word: '今天', pinyin: 'jin1 tian1', definition: 'today' },
  { word: '九', pinyin: 'jiu3', definition: 'nine' },
  { word: '开', pinyin: 'kai1', definition: 'to open, to start' },
  { word: '看', pinyin: 'kan4', definition: 'to look, to see' },
  { word: '看见', pinyin: 'kan4 jian4', definition: 'to see' },
  { word: '块', pinyin: 'kuai4', definition: 'piece, lump, chunk' }
];

// HSK Level 2 vocabulary (extended)
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
  { word: '帮忙', pinyin: 'bang1 mang2', definition: 'to help' },
  { word: '报纸', pinyin: 'bao4 zhi3', definition: 'newspaper' },
  { word: '比', pinyin: 'bi3', definition: 'to compare' },
  { word: '比较', pinyin: 'bi3 jiao4', definition: 'comparatively, relatively' },
  { word: '别人', pinyin: 'bie2 ren2', definition: 'other people' },
  { word: '宾馆', pinyin: 'bin1 guan3', definition: 'hotel' },
  { word: '才', pinyin: 'cai2', definition: 'only then' },
  { word: '菜单', pinyin: 'cai4 dan1', definition: 'menu' },
  { word: '长', pinyin: 'chang2', definition: 'long' },
  { word: '唱歌', pinyin: 'chang4 ge1', definition: 'to sing' },
  { word: '出', pinyin: 'chu1', definition: 'to go out' },
  { word: '穿', pinyin: 'chuan1', definition: 'to wear' },
  { word: '次', pinyin: 'ci4', definition: 'time, occurrence' },
  { word: '从', pinyin: 'cong2', definition: 'from' },
  { word: '错', pinyin: 'cuo4', definition: 'wrong, mistake' },
  { word: '打篮球', pinyin: 'da3 lan2 qiu2', definition: 'to play basketball' },
  { word: '大家', pinyin: 'da4 jia1', definition: 'everyone' },
  { word: '到', pinyin: 'dao4', definition: 'to arrive' },
  { word: '得', pinyin: 'de5', definition: 'structural particle' },
  { word: '等', pinyin: 'deng3', definition: 'to wait' }
];

// Integrated Chinese Vocabulary (extended)
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
  { word: '认识', pinyin: 'ren4 shi5', definition: 'to know, to recognize' },
  { word: '高兴', pinyin: 'gao1 xing4', definition: 'happy' },
  { word: '忙', pinyin: 'mang2', definition: 'busy' },
  { word: '累', pinyin: 'lei4', definition: 'tired' },
  { word: '饿', pinyin: 'e4', definition: 'hungry' },
  { word: '渴', pinyin: 'ke3', definition: 'thirsty' },
  { word: '热', pinyin: 're4', definition: 'hot' },
  { word: '冷', pinyin: 'leng3', definition: 'cold' },
  { word: '贵', pinyin: 'gui4', definition: 'expensive' },
  { word: '便宜', pinyin: 'pian2 yi5', definition: 'cheap' },
  { word: '漂亮', pinyin: 'piao4 liang5', definition: 'pretty' },
  { word: '帅', pinyin: 'shuai4', definition: 'handsome' },
  { word: '高', pinyin: 'gao1', definition: 'tall' },
  { word: '矮', pinyin: 'ai3', definition: 'short (height)' },
  { word: '胖', pinyin: 'pang4', definition: 'fat' },
  { word: '瘦', pinyin: 'shou4', definition: 'thin' },
  { word: '快', pinyin: 'kuai4', definition: 'fast' },
  { word: '慢', pinyin: 'man4', definition: 'slow' },
  { word: '近', pinyin: 'jin4', definition: 'near' },
  { word: '远', pinyin: 'yuan3', definition: 'far' }
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
        // console.log(`Updated HSK level for "${word}" to ${hskLevel}`);
      }
      return existingChar.id;
    } else {
      // Character doesn't exist, insert it
      const insertResult = await client.query(
        'INSERT INTO characters (character, pinyin, "hsk_level") VALUES ($1, $2, $3) RETURNING id',
        [word, pinyin, hskLevel]
      );
      // console.log(`Added new character: "${word}" (HSK ${hskLevel})`);
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
    // console.log('Starting import of HSK and Integrated Chinese vocabulary...');
    
    // Import HSK Level 1
    // console.log(`Processing HSK Level 1 vocabulary (${hskLevel1Words.length} words)...`);
    for (const wordData of hskLevel1Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 1);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import HSK Level 2
    // console.log(`Processing HSK Level 2 vocabulary (${hskLevel2Words.length} words)...`);
    for (const wordData of hskLevel2Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 2);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import HSK Level 3
    // console.log(`Processing HSK Level 3 vocabulary (${hskLevel3Words.length} words)...`);
    for (const wordData of hskLevel3Words) {
      const { word, pinyin, definition } = wordData;
      const charId = await addOrUpdateCharacter(word, pinyin, 3);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
      }
    }
    
    // Import Integrated Chinese
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
  } else {
    console.error('HSK and Integrated Chinese vocabulary import failed');
  }
});