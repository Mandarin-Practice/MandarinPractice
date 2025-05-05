// Script to identify and remove traditional Chinese characters from the database
// This ensures our dictionary only contains simplified Chinese characters

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Common traditional-simplified character pairs for detection
const traditionalToSimplified = {
  // Traditional -> Simplified mapping (extended list)
  '繁': '繁',  // same - just for checking
  '體': '体',
  '國': '国',
  '華': '华',
  '會': '会',
  '個': '个',
  '時': '时',
  '產': '产',
  '說': '说',
  '與': '与',
  '學': '学',
  '實': '实',
  '發': '发',
  '電': '电',
  '經': '经',
  '東': '东',
  '關': '关',
  '問': '问',
  '義': '义',
  '長': '长',
  '開': '开',
  '書': '书',
  '車': '车',
  '觀': '观',
  '頭': '头',
  '語': '语',
  '進': '进',
  '還': '还',
  '當': '当',
  '對': '对',
  '業': '业',
  '樂': '乐',
  '應': '应',
  '氣': '气',
  '點': '点',
  '無': '无',
  '過': '过',
  '們': '们',
  '機': '机',
  '約': '约',
  '為': '为',
  '後': '后',
  '現': '现',
  '愛': '爱',
  '間': '间',
  '從': '从',
  '數': '数',
  '歲': '岁',
  '萬': '万',
  '這': '这',
  '條': '条',
  '權': '权',
  '親': '亲',
  '動': '动',
  '帶': '带',
  '電': '电',
  '臺': '台',
  '師': '师',
  '買': '买',
  '讀': '读',
  '變': '变',
  '節': '节',
  '風': '风',
  '給': '给',
  '務': '务',
  '總': '总',
  '鐘': '钟',
  '麼': '么',
  '麗': '丽',
  '聽': '听',
  '處': '处',
  '讓': '让',
  '實': '实',
  '難': '难',
  '興': '兴',
  '題': '题',
  '體': '体',
  '連': '连',
  '週': '周',
  '達': '达',
  '遠': '远',
  '傳': '传',
  '馬': '马',
  '單': '单',
  '願': '愿',
  '識': '识',
  '雖': '虽',
  '類': '类',
  '來': '来',
  '飛': '飞',
  '麵': '面',
  '團': '团',
  '險': '险',
  
  // Additional pairs
  '萬': '万',
  '與': '与',
  '醫': '医',
  '壹': '一',
  '億': '亿',
  '義': '义',
  '異': '异',
  '儀': '仪',
  '億': '亿',
  '壹': '一',
  '陰': '阴',
  '隱': '隐',
  '飲': '饮',
  '音': '音',
  '銀': '银',
  '應': '应',
  '營': '营',
  '熒': '荧',
  '蠅': '蝇',
  '穎': '颖',
  '喲': '哟',
  '擁': '拥',
  '傭': '佣',
  '踴': '踊',
  '優': '优',
  '憂': '忧',
  '郵': '邮',
  '鈾': '铀',
  '猶': '犹',
  '遊': '游',
  '誘': '诱',
  '輿': '舆',
  '魚': '鱼',
  '漁': '渔',
  '與': '与',
  '嶼': '屿',
  '語': '语',
  '獄': '狱',
  '譽': '誉',
  '預': '预',
  '馭': '驭',
  '獄': '狱',
  '閱': '阅',
  '雲': '云',
  '紮': '扎',
  '劄': '札',
  '閘': '闸',
  '氈': '毡',
  '斬': '斩',
  '盞': '盏',
  '氈': '毡',
  '戰': '战',
  '綻': '绽',
  '張': '张',
  '漲': '涨',
  '帳': '帐',
  '賬': '账',
  '脹': '胀',
  '趙': '赵',
  '訟': '讼',
  '鍾': '钟',
  '這': '这',
  '謫': '谪',
  '蟄': '蛰',
  '貞': '贞',
  '針': '针',
  '偵': '侦',
  '診': '诊',
  '鎮': '镇',
  '陣': '阵',
  '掙': '挣',
  '睜': '睁',
  '猙': '狰',
  '爭': '争',
  '幀': '帧',
  '癥': '症',
  '鄭': '郑',
  '證': '证',
  '織': '织',
  '職': '职',
  '執': '执',
  '紙': '纸',
  '誌': '志',
  '製': '制',
  '幟': '帜',
  '質': '质',
  '摯': '挚',
  '擲': '掷',
  '滯': '滞',
  '鐘': '钟',
  '終': '终',
  '種': '种',
  '腫': '肿',
  '眾': '众',
  '謅': '诌',
  '軸': '轴',
  '晝': '昼',
  '皺': '皱',
  '驟': '骤',
  '豬': '猪',
  '諸': '诸',
  '誅': '诛',
  '燭': '烛',
  '著': '着',
  '著': '着',
  '貯': '贮',
  '鑄': '铸',
  '築': '筑',
  '囑': '嘱',
  '專': '专',
  '磚': '砖',
  '轉': '转',
  '賺': '赚',
  '樁': '桩',
  '裝': '装',
  '狀': '状',
  '壯': '壮',
  '莊': '庄',
  '追': '追',
  '資': '资',
  '諮': '咨',
  '綜': '综',
  '總': '总',
  '縱': '纵',
  '糉': '粽',
  '鑽': '钻',
  '賄': '贿',
  '團': '团',
  
  // Many more pairs could be added
  '聯': '联',
  '廳': '厅',
  '頁': '页',
  '聖': '圣',
  '藏': '藏',
  '壤': '壤',
  '讚': '赞'
};

// Function to check if a character contains traditional characters
function containsTraditionalCharacters(text) {
  if (!text) return false;
  
  // Additional traditional character detection
  const traditionalIndicators = [
    '為', '個', '來', '這', '們', '時', '點', '後',
    '學', '說', '還', '開', '頭', '過', '進', '發',
    '響', '產', '電', '實', '現', '間', '語', '對',
    '錯', '關', '經', '專', '處', '萬', '國', '華',
    '務', '體', '總', '動', '獲', '書', '師', '買',
    '長', '門', '問', '義', '東', '類', '書', '網',
    '會', '車', '當', '從', '單', '鐵', '資', '業',
    '讓', '論', '響', '應', '營', '權', '條', '難',
    '親', '頭', '齊', '廳', '樹', '練', '務', '機',
    '視', '識', '誰', '題', '雜', '導', '燈', '續',
    '證', '輸', '織', '責', '職', '聯', '隱', '誤', 
    '藝', '億', '議', '誘', '優', '願', '園', '轎',
    '獄', '預', '閱', '躍', '員', '運', '藥', '載',
    '壯', '準', '隨', '總', '鑽', '虛', '飄', '憐',
    '樂', '廠', '禮', '廢', '齒', '衛', '圍'
  ];
  
  // Check for exact matches of common traditional multi-character words/phrases
  const traditionalPhrases = [
    '這個', '個人', '時間', '學生', '學習', '開始', '電話',
    '電腦', '發現', '還有', '裡面', '對話', '關於', '經濟',
    '華語', '漢語', '雙語', '認為', '體育', '體操', '歷史',
    '網絡', '網路', '單詞', '書籍', '學校', '語言', '義務',
    '動物', '書店', '車站', '問題', '東西', '報紙', '報錶',
    '見面', '見證', '課餘', '課間', '課本', '點心', '後面'
  ];
  
  // Check for exact multi-character phrases first
  if (traditionalPhrases.includes(text)) {
    return true;
  }
  
  // Check for individual traditional characters
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    // If the character is in our map as a key, it's traditional
    if (Object.keys(traditionalToSimplified).includes(char) || 
        traditionalIndicators.includes(char)) {
      return true;
    }
  }
  
  return false;
}

// Find and log traditional characters in the database
async function findTraditionalCharacters(limit = 200) {
  const client = await pool.connect();
  
  try {
    console.log('Scanning for traditional Chinese characters...');
    
    // Search in the characters table
    const result = await client.query('SELECT id, character, pinyin FROM characters');
    
    let traditionalCount = 0;
    let simplifiedCount = 0;
    const traditionalCharacters = [];
    
    // Check each character
    for (const row of result.rows) {
      const { id, character, pinyin } = row;
      
      if (containsTraditionalCharacters(character)) {
        traditionalCount++;
        traditionalCharacters.push({ id, character, pinyin });
        
        // Apply limit to avoid timeout
        if (traditionalCharacters.length >= limit) {
          console.log(`Reached limit of ${limit} traditional characters. Stopping scan.`);
          break;
        }
      } else {
        simplifiedCount++;
      }
    }
    
    console.log(`Found ${traditionalCount} characters with traditional characters (limited to ${limit})`);
    console.log(`Found ${simplifiedCount} simplified characters`);
    
    if (traditionalCharacters.length > 0) {
      console.log('\nTraditional characters found:');
      traditionalCharacters.slice(0, 20).forEach(char => {
        console.log(`ID: ${char.id}, Character: ${char.character}, Pinyin: ${char.pinyin}`);
      });
      
      if (traditionalCharacters.length > 20) {
        console.log(`... and ${traditionalCharacters.length - 20} more`);
      }
    }
    
    return traditionalCharacters;
  } catch (error) {
    console.error('Error finding traditional characters:', error);
    return [];
  } finally {
    client.release();
  }
}

// Remove traditional characters from the database
async function removeTraditionalCharacters() {
  const traditionalChars = await findTraditionalCharacters();
  
  if (traditionalChars.length === 0) {
    console.log('No traditional characters found to remove.');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    console.log('\nRemoving traditional characters...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    let removedCount = 0;
    
    // Remove each traditional character and its related data
    for (const char of traditionalChars) {
      try {
        // First, check and delete any character_compounds relationships
        await client.query('DELETE FROM character_compounds WHERE component_id = $1 OR compound_id = $1', [char.id]);
        
        // Delete any learned_definitions referencing this character's definitions
        await client.query(`
          DELETE FROM learned_definitions 
          WHERE definition_id IN (
            SELECT id FROM character_definitions WHERE character_id = $1
          )
        `, [char.id]);
        
        // Delete character definitions
        await client.query('DELETE FROM character_definitions WHERE character_id = $1', [char.id]);
        
        // Finally delete the character
        const result = await client.query('DELETE FROM characters WHERE id = $1', [char.id]);
        
        if (result.rowCount > 0) {
          removedCount++;
          console.log(`Removed: ${char.character} (ID: ${char.id})`);
        }
      } catch (err) {
        console.log(`Skipping character ${char.character} (ID: ${char.id}) due to: ${err.message}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log(`\nRemoved ${removedCount} traditional characters from the database.`);
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Error removing traditional characters:', error);
  } finally {
    client.release();
  }
}

// Run the script
async function main() {
  try {
    await removeTraditionalCharacters();
    console.log('Traditional character cleanup completed successfully.');
  } catch (error) {
    console.error('An error occurred during traditional character cleanup:', error);
  } finally {
    await pool.end();
  }
}

main();