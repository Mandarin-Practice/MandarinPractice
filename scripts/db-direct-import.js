#!/usr/bin/env node
// Direct database import script for sample characters
// Bypasses ESM issues by using direct SQL queries

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neonConfig for WebSockets
neonConfig.webSocketConstructor = ws;

// Configure database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Common Chinese characters with definitions
const sampleCharacters = [
  { 
    character: '你', 
    pinyin: 'nǐ', 
    strokes: 7, 
    radical: '亻', 
    hskLevel: 1, 
    frequency: 7,
    definitions: [
      { definition: 'you', partOfSpeech: 'pron', order: 1 }
    ]
  },
  { 
    character: '好', 
    pinyin: 'hǎo', 
    strokes: 6, 
    radical: '女', 
    hskLevel: 1, 
    frequency: 20,
    definitions: [
      { definition: 'good', partOfSpeech: 'adj', order: 1 },
      { definition: 'well', partOfSpeech: 'adv', order: 2 },
      { definition: 'to be fond of', partOfSpeech: 'v', order: 3 }
    ]
  },
  { 
    character: '我', 
    pinyin: 'wǒ', 
    strokes: 7, 
    radical: '戈', 
    hskLevel: 1, 
    frequency: 4,
    definitions: [
      { definition: 'I, me', partOfSpeech: 'pron', order: 1 },
      { definition: 'my, mine', partOfSpeech: 'pron', order: 2 }
    ]
  },
  { 
    character: '是', 
    pinyin: 'shì', 
    strokes: 9, 
    radical: '日', 
    hskLevel: 1, 
    frequency: 2,
    definitions: [
      { definition: 'to be', partOfSpeech: 'v', order: 1 },
      { definition: 'yes', partOfSpeech: 'adv', order: 2 }
    ]
  },
  { 
    character: '爱', 
    pinyin: 'ài', 
    strokes: 10, 
    radical: '爪', 
    hskLevel: 1, 
    frequency: 114,
    definitions: [
      { definition: 'to love', partOfSpeech: 'v', order: 1 },
      { definition: 'affection', partOfSpeech: 'n', order: 2 }
    ]
  }
];

// Stats for tracking progress
const stats = {
  charactersAdded: 0,
  charactersUpdated: 0,
  definitionsAdded: 0,
  errors: 0
};

// Function to add a character using direct SQL
async function addCharacter(characterData) {
  const client = await pool.connect();
  try {
    const { character, pinyin, strokes, radical, hskLevel, frequency, definitions } = characterData;
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if character already exists
    const existingCharCheck = await client.query(
      'SELECT id FROM characters WHERE character = $1',
      [character]
    );
    
    let characterId;
    
    if (existingCharCheck.rows.length > 0) {
      // Update character
      characterId = existingCharCheck.rows[0].id;
      await client.query(
        'UPDATE characters SET pinyin = $1, strokes = $2, radical = $3, hsk_level = $4, frequency = $5 WHERE id = $6',
        [pinyin, strokes, radical, hskLevel, frequency, characterId]
      );
      stats.charactersUpdated++;
      // console.log(`Updated character: ${character}`);
    } else {
      // Add new character
      const result = await client.query(
        'INSERT INTO characters (character, pinyin, strokes, radical, hsk_level, frequency) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [character, pinyin, strokes, radical, hskLevel, frequency]
      );
      characterId = result.rows[0].id;
      stats.charactersAdded++;
      // console.log(`Added character: ${character}`);
    }
    
    // Add definitions
    for (const def of definitions) {
      await client.query(
        'INSERT INTO character_definitions (character_id, definition, part_of_speech, "order") VALUES ($1, $2, $3, $4)',
        [characterId, def.definition, def.partOfSpeech, def.order]
      );
      stats.definitionsAdded++;
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    return true;
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error(`Error adding character ${characterData.character}:`, err);
    stats.errors++;
    return false;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  // console.log('Starting sample Chinese character import...');
  
  try {
    // Add each sample character
    for (const charData of sampleCharacters) {
      await addCharacter(charData);
    }
    
    // Print summary
    // console.log('\nImport completed successfully!');
    // console.log('Summary:');
    // console.log(`- Characters added: ${stats.charactersAdded}`);
    // console.log(`- Characters updated: ${stats.charactersUpdated}`);
    // console.log(`- Definitions added: ${stats.definitionsAdded}`);
    // console.log(`- Errors encountered: ${stats.errors}`);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error in main process:', err);
    await pool.end();
    process.exit(1);
  }
}

// Start the import process
main();