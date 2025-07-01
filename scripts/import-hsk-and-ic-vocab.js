// Import HSK vocabulary and Integrated Chinese textbook vocabulary
// This script updates the database with HSK level information for existing characters
// and adds any missing HSK and Integrated Chinese vocabulary

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { eq, like } from 'drizzle-orm';
import { characters, characterDefinitions } from '../shared/schema.js';

// HSK Vocabulary Lists (Simplified Chinese)
const hskVocabulary = {
  // HSK Level 1 (150 words)
  1: [
    { word: '爱', pinyin: 'ai4', definition: 'to love', },
    { word: '八', pinyin: 'ba1', definition: 'eight', },
    { word: '爸爸', pinyin: 'ba4 ba5', definition: 'father', },
    { word: '杯子', pinyin: 'bei1 zi5', definition: 'cup', },
    { word: '北京', pinyin: 'Bei3 jing1', definition: 'Beijing', },
    { word: '本', pinyin: 'ben3', definition: 'measure word for books, etc.', },
    { word: '不客气', pinyin: 'bu4 ke4 qi5', definition: "you're welcome", },
    { word: '不', pinyin: 'bu4', definition: 'no, not', },
    { word: '菜', pinyin: 'cai4', definition: 'dish, vegetable', },
    { word: '茶', pinyin: 'cha2', definition: 'tea', },
    { word: '吃', pinyin: 'chi1', definition: 'to eat', },
    { word: '出租车', pinyin: 'chu1 zu1 che1', definition: 'taxi', },
    { word: '打电话', pinyin: 'da3 dian4 hua4', definition: 'to make a phone call', },
    { word: '大', pinyin: 'da4', definition: 'big, large', },
    { word: '的', pinyin: 'de5', definition: 'possessive particle', },
    { word: '点', pinyin: 'dian3', definition: 'o`clock, point', },
    { word: '电脑', pinyin: 'dian4 nao3', definition: 'computer', },
    { word: '电视', pinyin: 'dian4 shi4', definition: 'television', },
    { word: '电影', pinyin: 'dian4 ying3', definition: 'movie', },
    { word: '东西', pinyin: 'dong1 xi5', definition: 'thing, stuff', },
    { word: '都', pinyin: 'dou1', definition: 'all, both', },
    { word: '读', pinyin: 'du2', definition: 'to read', },
    { word: '对不起', pinyin: 'dui4 bu5 qi3', definition: 'sorry', },
    { word: '多', pinyin: 'duo1', definition: 'many, much, more', },
    { word: '多少', pinyin: 'duo1 shao5', definition: 'how many, how much', },
    { word: '儿子', pinyin: 'er2 zi5', definition: 'son', },
    { word: '二', pinyin: 'er4', definition: 'two', },
    { word: '饭店', pinyin: 'fan4 dian4', definition: 'restaurant', },
    { word: '飞机', pinyin: 'fei1 ji1', definition: 'airplane', },
    { word: '分钟', pinyin: 'fen1 zhong1', definition: 'minute', },
    { word: '高兴', pinyin: 'gao1 xing4', definition: 'happy', },
    { word: '个', pinyin: 'ge4', definition: 'individual, measure word', },
    { word: '工作', pinyin: 'gong1 zuo4', definition: 'job, work', },
    { word: '狗', pinyin: 'gou3', definition: 'dog', },
    { word: '汉语', pinyin: 'Han4 yu3', definition: 'Chinese language', },
    { word: '好', pinyin: 'hao3', definition: 'good', },
    { word: '号', pinyin: 'hao4', definition: 'number', },
    { word: '喝', pinyin: 'he1', definition: 'to drink', },
    { word: '和', pinyin: 'he2', definition: 'and', },
    { word: '很', pinyin: 'hen3', definition: 'very', },
    { word: '后面', pinyin: 'hou4 mian5', definition: 'behind', },
    { word: '回', pinyin: 'hui2', definition: 'to return', },
    { word: '会', pinyin: 'hui4', definition: 'can, to be able to', },
    { word: '几', pinyin: 'ji3', definition: 'how many, several', },
    { word: '家', pinyin: 'jia1', definition: 'home, family', },
    { word: '叫', pinyin: 'jiao4', definition: 'to be called', },
    { word: '今天', pinyin: 'jin1 tian1', definition: 'today', },
    { word: '九', pinyin: 'jiu3', definition: 'nine', },
    { word: '开', pinyin: 'kai1', definition: 'to open, to start', },
    { word: '看', pinyin: 'kan4', definition: 'to look, to watch', },
    { word: '看见', pinyin: 'kan4 jian4', definition: 'to see', },
    { word: '块', pinyin: 'kuai4', definition: 'piece, yuan (Chinese currency)', },
    { word: '来', pinyin: 'lai2', definition: 'to come', },
    { word: '老师', pinyin: 'lao3 shi1', definition: 'teacher', },
    { word: '了', pinyin: 'le5', definition: 'particle indicating completed action', },
    { word: '冷', pinyin: 'leng3', definition: 'cold', },
    { word: '里', pinyin: 'li3', definition: 'inside, within', },
    { word: '零', pinyin: 'ling2', definition: 'zero', },
    { word: '六', pinyin: 'liu4', definition: 'six', },
    { word: '妈妈', pinyin: 'ma1 ma5', definition: 'mother, mom', },
    { word: '吗', pinyin: 'ma5', definition: 'question particle', },
    { word: '买', pinyin: 'mai3', definition: 'to buy', },
    { word: '猫', pinyin: 'mao1', definition: 'cat', },
    { word: '没关系', pinyin: 'mei2 guan1 xi5', definition: "it doesn't matter", },
    { word: '没有', pinyin: 'mei2 you3', definition: "don't have, there isn't", },
    { word: '米饭', pinyin: 'mi3 fan4', definition: 'rice', },
    { word: '明天', pinyin: 'ming2 tian1', definition: 'tomorrow', },
    { word: '名字', pinyin: 'ming2 zi5', definition: 'name', },
    { word: '哪', pinyin: 'na3', definition: 'which', },
    { word: '哪儿', pinyin: 'na3 r5', definition: 'where', },
    { word: '那', pinyin: 'na4', definition: 'that', },
    { word: '呢', pinyin: 'ne5', definition: 'particle indicating question', },
    { word: '能', pinyin: 'neng2', definition: 'can, to be able to', },
    { word: '你', pinyin: 'ni3', definition: 'you (singular)', },
    { word: '年', pinyin: 'nian2', definition: 'year', },
    { word: '女儿', pinyin: 'nü3 er2', definition: 'daughter', },
    { word: '朋友', pinyin: 'peng2 you5', definition: 'friend', },
    { word: '漂亮', pinyin: 'piao4 liang5', definition: 'pretty', },
    { word: '苹果', pinyin: 'ping2 guo3', definition: 'apple', },
    { word: '七', pinyin: 'qi1', definition: 'seven', },
    { word: '钱', pinyin: 'qian2', definition: 'money', },
    { word: '前面', pinyin: 'qian2 mian5', definition: 'in front', },
    { word: '请', pinyin: 'qing3', definition: 'please', },
    { word: '去', pinyin: 'qu4', definition: 'to go', },
    { word: '热', pinyin: 're4', definition: 'hot', },
    { word: '人', pinyin: 'ren2', definition: 'person, people', },
    { word: '认识', pinyin: 'ren4 shi5', definition: 'to know (someone)', },
    { word: '日', pinyin: 'ri4', definition: 'day, date, sun', },
    { word: '三', pinyin: 'san1', definition: 'three', },
    { word: '商店', pinyin: 'shang1 dian4', definition: 'store, shop', },
    { word: '上', pinyin: 'shang4', definition: 'on, above, up', },
    { word: '上午', pinyin: 'shang4 wu3', definition: 'morning', },
    { word: '少', pinyin: 'shao3', definition: 'few, little', },
    { word: '谁', pinyin: 'shei2', definition: 'who', },
    { word: '什么', pinyin: 'shen2 me5', definition: 'what', },
    { word: '十', pinyin: 'shi2', definition: 'ten', },
    { word: '时候', pinyin: 'shi2 hou5', definition: 'time, moment', },
    { word: '是', pinyin: 'shi4', definition: 'to be', },
    { word: '书', pinyin: 'shu1', definition: 'book', },
    { word: '水', pinyin: 'shui3', definition: 'water', },
    { word: '水果', pinyin: 'shui3 guo3', definition: 'fruit', },
    { word: '睡觉', pinyin: 'shui4 jiao4', definition: 'to sleep', },
    { word: '说', pinyin: 'shuo1', definition: 'to speak', },
    { word: '四', pinyin: 'si4', definition: 'four', },
    { word: '岁', pinyin: 'sui4', definition: 'year (of age)', },
    { word: '他', pinyin: 'ta1', definition: 'he, him', },
    { word: '她', pinyin: 'ta1', definition: 'she, her', },
    { word: '太', pinyin: 'tai4', definition: 'too, very', },
    { word: '天气', pinyin: 'tian1 qi4', definition: 'weather', },
    { word: '听', pinyin: 'ting1', definition: 'to listen', },
    { word: '同学', pinyin: 'tong2 xue2', definition: 'classmate', },
    { word: '喂', pinyin: 'wei4', definition: 'hello (on phone)', },
    { word: '我', pinyin: 'wo3', definition: 'I, me', },
    { word: '我们', pinyin: 'wo3 men5', definition: 'we, us', },
    { word: '五', pinyin: 'wu3', definition: 'five', },
    { word: '喜欢', pinyin: 'xi3 huan5', definition: 'to like', },
    { word: '下', pinyin: 'xia4', definition: 'down, below', },
    { word: '下午', pinyin: 'xia4 wu3', definition: 'afternoon', },
    { word: '下雨', pinyin: 'xia4 yu3', definition: 'to rain', },
    { word: '先生', pinyin: 'xian1 sheng5', definition: 'Mr., sir', },
    { word: '现在', pinyin: 'xian4 zai4', definition: 'now', },
    { word: '想', pinyin: 'xiang3', definition: 'to want, to think', },
    { word: '小', pinyin: 'xiao3', definition: 'small, little', },
    { word: '小姐', pinyin: 'xiao3 jie3', definition: 'Miss, young lady', },
    { word: '些', pinyin: 'xie1', definition: 'some', },
    { word: '写', pinyin: 'xie3', definition: 'to write', },
    { word: '谢谢', pinyin: 'xie4 xie5', definition: 'thank you', },
    { word: '星期', pinyin: 'xing1 qi1', definition: 'week', },
    { word: '学生', pinyin: 'xue2 sheng5', definition: 'student', },
    { word: '学习', pinyin: 'xue2 xi2', definition: 'to study, to learn', },
    { word: '学校', pinyin: 'xue2 xiao4', definition: 'school', },
    { word: '一', pinyin: 'yi1', definition: 'one', },
    { word: '衣服', pinyin: 'yi1 fu5', definition: 'clothes', },
    { word: '医生', pinyin: 'yi1 sheng1', definition: 'doctor', },
    { word: '医院', pinyin: 'yi1 yuan4', definition: 'hospital', },
    { word: '椅子', pinyin: 'yi3 zi5', definition: 'chair', },
    { word: '有', pinyin: 'you3', definition: 'to have', },
    { word: '月', pinyin: 'yue4', definition: 'month, moon', },
    { word: '在', pinyin: 'zai4', definition: 'at, in, on', },
    { word: '再见', pinyin: 'zai4 jian4', definition: 'goodbye', },
    { word: '怎么', pinyin: 'zen3 me5', definition: 'how', },
    { word: '怎么样', pinyin: 'zen3 me5 yang4', definition: 'how about', },
    { word: '这', pinyin: 'zhe4', definition: 'this', },
    { word: '中国', pinyin: 'Zhong1 guo2', definition: 'China', },
    { word: '中午', pinyin: 'zhong1 wu3', definition: 'noon', },
    { word: '住', pinyin: 'zhu4', definition: 'to live', },
    { word: '桌子', pinyin: 'zhuo1 zi5', definition: 'desk, table', },
    { word: '字', pinyin: 'zi4', definition: 'character, word', },
    { word: '昨天', pinyin: 'zuo2 tian1', definition: 'yesterday', },
    { word: '坐', pinyin: 'zuo4', definition: 'to sit', },
    { word: '做', pinyin: 'zuo4', definition: 'to do', },
  ],
  
  // Add a subset of HSK Level 2 vocabulary (sample)
  2: [
    { word: '啊', pinyin: 'a5', definition: 'interjection of surprise', },
    { word: '阿姨', pinyin: 'a1 yi2', definition: 'aunt', },
    { word: '矮', pinyin: 'ai3', definition: 'short (height)', },
    { word: '爱好', pinyin: 'ai4 hao4', definition: 'hobby', },
    { word: '安静', pinyin: 'an1 jing4', definition: 'quiet', },
    { word: '把', pinyin: 'ba3', definition: 'to hold, to take', },
    { word: '班', pinyin: 'ban1', definition: 'class', },
    { word: '搬', pinyin: 'ban1', definition: 'to move, to carry', },
    { word: '办法', pinyin: 'ban4 fa3', definition: 'way, method', },
    { word: '办公室', pinyin: 'ban4 gong1 shi4', definition: 'office', },
    { word: '帮忙', pinyin: 'bang1 mang2', definition: 'to help', },
    { word: '包', pinyin: 'bao1', definition: 'bag, to wrap', },
    { word: '饱', pinyin: 'bao3', definition: 'full (after eating)', },
    { word: '北方', pinyin: 'bei3 fang1', definition: 'north', },
    { word: '被', pinyin: 'bei4', definition: 'by (passive marker)', },
    { word: '鼻子', pinyin: 'bi2 zi5', definition: 'nose', },
    { word: '比', pinyin: 'bi3', definition: 'to compare', },
    { word: '比较', pinyin: 'bi3 jiao4', definition: 'rather, quite', },
    { word: '比赛', pinyin: 'bi3 sai4', definition: 'match, competition', },
    { word: '必须', pinyin: 'bi4 xu1', definition: 'must', },
    { word: '变化', pinyin: 'bian4 hua4', definition: 'change', },
    { word: '别人', pinyin: 'bie2 ren2', definition: 'other people', },
    { word: '宾馆', pinyin: 'bin1 guan3', definition: 'hotel', },
    { word: '懂', pinyin: 'dong3', definition: 'to understand', },
    { word: '房间', pinyin: 'fang2 jian1', definition: 'room', },
    { word: '附近', pinyin: 'fu4 jin4', definition: 'nearby', },
    { word: '干净', pinyin: 'gan1 jing4', definition: 'clean', },
    { word: '刚才', pinyin: 'gang1 cai2', definition: 'just now', },
    { word: '公共汽车', pinyin: 'gong1 gong4 qi4 che1', definition: 'bus', },
    { word: '公斤', pinyin: 'gong1 jin1', definition: 'kilogram', },
  ],

  // Sample of HSK 3 vocabulary
  3: [
    { word: '按时', pinyin: 'an4 shi2', definition: 'on time', },
    { word: '百分之', pinyin: 'bai3 fen1 zhi1', definition: 'percent', },
    { word: '棒', pinyin: 'bang4', definition: 'great, excellent', },
    { word: '保护', pinyin: 'bao3 hu4', definition: 'to protect', },
    { word: '保证', pinyin: 'bao3 zheng4', definition: 'to guarantee', },
    { word: '报名', pinyin: 'bao4 ming2', definition: 'to register', },
    { word: '抱', pinyin: 'bao4', definition: 'to hold, to carry', },
    { word: '抱歉', pinyin: 'bao4 qian4', definition: 'sorry', },
    { word: '倍', pinyin: 'bei4', definition: 'times (multiple)', },
    { word: '本来', pinyin: 'ben3 lai2', definition: 'originally', },
    { word: '笨', pinyin: 'ben4', definition: 'stupid', },
    { word: '比如', pinyin: 'bi3 ru2', definition: 'for example', },
    { word: '毕业', pinyin: 'bi4 ye4', definition: 'to graduate', },
    { word: '遍', pinyin: 'bian4', definition: 'all over, everywhere', },
    { word: '标准', pinyin: 'biao1 zhun3', definition: 'standard', },
  ],

  // Sample of HSK 4 vocabulary
  4: [
    { word: '安排', pinyin: 'an1 pai2', definition: 'to arrange', },
    { word: '暗', pinyin: 'an4', definition: 'dark', },
    { word: '把握', pinyin: 'ba3 wo4', definition: 'to grasp', },
    { word: '摆', pinyin: 'bai3', definition: 'to place, to display', },
    { word: '班主任', pinyin: 'ban1 zhu3 ren4', definition: 'class teacher', },
    { word: '办理', pinyin: 'ban4 li3', definition: 'to handle, to process', },
    { word: '傍晚', pinyin: 'bang4 wan3', definition: 'evening', },
  ],

  // Sample of HSK 5 vocabulary
  5: [
    { word: '暧昧', pinyin: 'ai4 mei4', definition: 'ambiguous', },
    { word: '熬夜', pinyin: 'ao2 ye4', definition: 'to stay up late', },
    { word: '罢工', pinyin: 'ba4 gong1', definition: 'to go on strike', },
    { word: '败', pinyin: 'bai4', definition: 'to be defeated', },
    { word: '办事处', pinyin: 'ban4 shi4 chu3', definition: 'office', },
  ],

  // Sample of HSK 6 vocabulary
  6: [
    { word: '傲慢', pinyin: 'ao4 man4', definition: 'arrogant', },
    { word: '奥秘', pinyin: 'ao4 mi4', definition: 'mystery', },
    { word: '八卦', pinyin: 'ba1 gua4', definition: 'gossip', },
    { word: '跋涉', pinyin: 'ba2 she4', definition: 'to trek', },
    { word: '把关', pinyin: 'ba3 guan1', definition: 'to check, to examine', },
  ],
};

// Integrated Chinese Vocabulary (Sample)
const integratedChineseVocabulary = [
  { word: '你好', pinyin: 'ni3 hao3', definition: 'hello', },
  { word: '谢谢', pinyin: 'xie4 xie5', definition: 'thank you', },
  { word: '再见', pinyin: 'zai4 jian4', definition: 'goodbye', },
  { word: '请问', pinyin: 'qing3 wen4', definition: 'may I ask', },
  { word: '对不起', pinyin: 'dui4 bu5 qi3', definition: 'sorry', },
  { word: '没关系', pinyin: 'mei2 guan1 xi5', definition: "it's okay", },
  { word: '老师', pinyin: 'lao3 shi1', definition: 'teacher', },
  { word: '学生', pinyin: 'xue2 sheng5', definition: 'student', },
  { word: '同学', pinyin: 'tong2 xue2', definition: 'classmate', },
  { word: '朋友', pinyin: 'peng2 you5', definition: 'friend', },
  { word: '认识', pinyin: 'ren4 shi5', definition: 'to know (someone)', },
  { word: '很', pinyin: 'hen3', definition: 'very', },
  { word: '高兴', pinyin: 'gao1 xing4', definition: 'happy', },
  { word: '喜欢', pinyin: 'xi3 huan5', definition: 'to like', },
  { word: '中文', pinyin: 'zhong1 wen2', definition: 'Chinese language', },
  { word: '英文', pinyin: 'ying1 wen2', definition: 'English language', },
  { word: '名字', pinyin: 'ming2 zi5', definition: 'name', },
  { word: '叫', pinyin: 'jiao4', definition: 'to be called', },
  { word: '什么', pinyin: 'shen2 me5', definition: 'what', },
  { word: '是', pinyin: 'shi4', definition: 'to be', },
  { word: '的', pinyin: 'de5', definition: 'possessive particle', },
  { word: '吗', pinyin: 'ma5', definition: 'question particle', },
  { word: '呢', pinyin: 'ne5', definition: 'particle indicating question', },
  { word: '先生', pinyin: 'xian1 sheng5', definition: 'mister, sir', },
  { word: '小姐', pinyin: 'xiao3 jie3', definition: 'miss', },
  { word: '太太', pinyin: 'tai4 tai5', definition: 'Mrs., wife', },
  { word: '上', pinyin: 'shang4', definition: 'on, above', },
  { word: '下', pinyin: 'xia4', definition: 'below, under', },
  { word: '前面', pinyin: 'qian2 mian5', definition: 'in front of', },
  { word: '后面', pinyin: 'hou4 mian5', definition: 'behind', },
];

// Configure neon database with websockets
import * as neonConfig from '@neondatabase/serverless';
neonConfig.default.webSocketConstructor = ws;

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Connect to the database using Drizzle ORM
const db = drizzle(pool);

// Helper function to create a character if it doesn't exist
async function addOrUpdateCharacter(character, pinyin, hskLevel) {
  try {
    // Check if the character exists
    const existingResult = await db.select()
      .from(characters)
      .where(eq(characters.character, character));
    
    if (existingResult.length > 0) {
      // Character exists, update HSK level if needed
      const existingChar = existingResult[0];
      if (!existingChar.hsk_level || (hskLevel && hskLevel < existingChar.hsk_level)) {
        // Update with the lower HSK level (lower is more common/basic)
        await db.update(characters)
          .set({ hsk_level: hskLevel })
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
          hsk_level: hskLevel,
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
async function addDefinitionIfNeeded(characterId, definition) {
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
      //// console.log(`Added definition "${definition}" for character ID ${characterId}`);
      return newDef.id;
    }
    return null;
  } catch (error) {
    console.error(`Error adding definition for character ID ${characterId}:`, error);
    return null;
  }
}

// Main function to import HSK and Integrated Chinese vocabulary
async function importHSKAndICVocabulary() {
  try {
    // console.log('Starting import of HSK and Integrated Chinese vocabulary...');
    
    // Import HSK vocabulary
    let totalImported = 0;
    let totalUpdated = 0;
    
    // Process each HSK level
    for (const [level, words] of Object.entries(hskVocabulary)) {
      // console.log(`Processing HSK Level ${level} (${words.length} words)...`);
      
      for (const wordData of words) {
        const { word, pinyin, definition } = wordData;
        
        // For multi-character words, process each character
        if (word.length > 1) {
          // Add the compound word itself first
          const compoundId = await addOrUpdateCharacter(word, pinyin, parseInt(level));
          if (compoundId) {
            await addDefinitionIfNeeded(compoundId, definition);
            totalImported++;
          }
          
          // Then process individual characters if needed
          // (skipping the individual character processing for brevity)
        } else {
          // Single character
          const charId = await addOrUpdateCharacter(word, pinyin, parseInt(level));
          if (charId) {
            await addDefinitionIfNeeded(charId, definition);
            totalImported++;
          }
        }
      }
    }
    
    // Import Integrated Chinese vocabulary
    // console.log(`Processing Integrated Chinese vocabulary (${integratedChineseVocabulary.length} words)...`);
    for (const wordData of integratedChineseVocabulary) {
      const { word, pinyin, definition } = wordData;
      
      // Add the compound word (no HSK level specified, so using null)
      const charId = await addOrUpdateCharacter(word, pinyin, null);
      if (charId) {
        await addDefinitionIfNeeded(charId, definition);
        totalImported++;
      }
    }
    
    // console.log(`Finished importing vocabulary!`);
    // console.log(`Total words processed: ${totalImported}`);
    
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