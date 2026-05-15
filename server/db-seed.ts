import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { db } from './db';
import { log } from './vite';
import { eq, sql } from 'drizzle-orm';

// Common Chinese characters with their information
// This is a small initial dataset to ensure the dictionary works out of the box
const initialCharacters = [
  // Common single characters
  { character: '我', pinyin: 'wǒ', strokes: 7, radical: '戈', hskLevel: 1, frequency: 2, definition: 'I; me' },
  { character: '你', pinyin: 'nǐ', strokes: 7, radical: '亻', hskLevel: 1, frequency: 7, definition: 'you' },
  { character: '好', pinyin: 'hǎo', strokes: 6, radical: '女', hskLevel: 1, frequency: 20, definition: 'good; well' },
  { character: '是', pinyin: 'shì', strokes: 9, radical: '日', hskLevel: 1, frequency: 3, definition: 'to be; is; are' },
  { character: '不', pinyin: 'bù', strokes: 4, radical: '一', hskLevel: 1, frequency: 8, definition: 'no; not' },
  { character: '人', pinyin: 'rén', strokes: 2, radical: '人', hskLevel: 1, frequency: 5, definition: 'person; people' },
  { character: '中', pinyin: 'zhōng', strokes: 4, radical: '丨', hskLevel: 1, frequency: 12, definition: 'middle; center; China' },
  { character: '学', pinyin: 'xué', strokes: 8, radical: '子', hskLevel: 1, frequency: 30, definition: 'to study; to learn' },
  { character: '生', pinyin: 'shēng', strokes: 5, radical: '生', hskLevel: 1, frequency: 33, definition: 'to be born; life' },
  { character: '国', pinyin: 'guó', strokes: 8, radical: '囗', hskLevel: 1, frequency: 18, definition: 'country; nation' },
  { character: '谢', pinyin: 'xiè', strokes: 16, radical: '讠', hskLevel: 1, frequency: 78, definition: 'to thank; thanks' },
  
  // Common compound words
  { character: '你好', pinyin: 'nǐ hǎo', strokes: 13, radical: '亻', hskLevel: 1, frequency: 1, definition: 'hello' },
  { character: '中国', pinyin: 'zhōng guó', strokes: 12, radical: '丨', hskLevel: 1, frequency: 4, definition: 'China' },
  { character: '学生', pinyin: 'xué shēng', strokes: 13, radical: '子', hskLevel: 1, frequency: 22, definition: 'student' },
  { character: '谢谢', pinyin: 'xiè xiè', strokes: 32, radical: '讠', hskLevel: 1, frequency: 3, definition: 'thank you' },
  { character: '不好', pinyin: 'bù hǎo', strokes: 10, radical: '一', hskLevel: 1, frequency: 15, definition: 'not good; bad' },
  { character: '学习', pinyin: 'xué xí', strokes: 16, radical: '子', hskLevel: 1, frequency: 25, definition: 'to study; to learn' },
  { character: '老师', pinyin: 'lǎo shī', strokes: 15, radical: '老', hskLevel: 1, frequency: 35, definition: 'teacher' },
  { character: '同学', pinyin: 'tóng xué', strokes: 14, radical: '口', hskLevel: 1, frequency: 45, definition: 'classmate' },
  { character: '朋友', pinyin: 'péng yǒu', strokes: 12, radical: '月', hskLevel: 1, frequency: 38, definition: 'friend' },
  { character: '认识', pinyin: 'rèn shí', strokes: 14, radical: '讠', hskLevel: 1, frequency: 40, definition: 'to know; to recognize' }
];

// Component relationships for compound words
const componentRelationships = [
  // 你好 (id placeholder) = 你 + 好
  { compound: '你好', components: ['你', '好'] },
  // 中国 (id placeholder) = 中 + 国
  { compound: '中国', components: ['中', '国'] },
  // 学生 (id placeholder) = 学 + 生
  { compound: '学生', components: ['学', '生'] },
  // 谢谢 (id placeholder) = 谢 + 谢
  { compound: '谢谢', components: ['谢', '谢'] },
  // 不好 (id placeholder) = 不 + 好
  { compound: '不好', components: ['不', '好'] }
];

/**
 * Run a script with the given path and return a promise
 * @param scriptPath Path to the script to run
 * @param scriptName Name of the script for logging
 */
async function runScript(scriptPath: string, scriptName: string): Promise<boolean> {
  return new Promise((resolve) => {
    log(`Starting ${scriptName} process...`, 'db-seed');
    
    const scriptProcess = exec(`node ${scriptPath}`, {
      env: { ...process.env }
    });
    
    scriptProcess.stdout?.on('data', (data: Buffer | string) => {
      log(`${scriptName}: ${data.toString().trim()}`, 'db-seed');
    });
    
    scriptProcess.stderr?.on('data', (data: Buffer | string) => {
      log(`${scriptName} error: ${data.toString().trim()}`, 'db-seed');
    });
    
    scriptProcess.on('close', (code: number | null) => {
      if (code === 0) {
        log(`${scriptName} completed successfully!`, 'db-seed');
        resolve(true);
      } else {
        log(`${scriptName} failed with code ${code}`, 'db-seed');
        resolve(false);
      }
    });
  });
}

/**
 * Run the full dictionary import script for comprehensive data
 * Used for admin-triggered full imports
 */
export async function runFullDictionaryImport(): Promise<boolean> {
  try {
    log('Starting full dictionary import process...', 'db-seed');
    
    // Execute the main import script
    const importAllPath = path.join(process.cwd(), 'scripts', 'import-all-data.js');
    const importResult = await runScript(importAllPath, 'Dictionary import');
    
    if (!importResult) {
      log('Main dictionary import failed, not continuing with additional scripts', 'db-seed');
      return false;
    }
    
    // Add missing characters
    const missingCharsPath = path.join(process.cwd(), 'scripts', 'add-missing-characters.js');
    const missingCharsResult = await runScript(missingCharsPath, 'Missing characters import');
    
    if (!missingCharsResult) {
      log('Missing characters import failed, will still try to create relationships', 'db-seed');
    }
    
    // Create character relationships
    const relationshipsPath = path.join(process.cwd(), 'scripts', 'create-character-relationships.js');
    const relationshipsResult = await runScript(relationshipsPath, 'Character relationships');
    
    if (!relationshipsResult) {
      log('Character relationships creation failed', 'db-seed');
    }
    
    return importResult && missingCharsResult && relationshipsResult;
  } catch (error) {
    log(`Error in dictionary import process: ${error}`, 'db-seed');
    return false;
  }
}