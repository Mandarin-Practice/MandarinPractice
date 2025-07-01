#!/usr/bin/env node
// Enhanced sample import script that properly handles snake_case column names in the database
// This script uses direct SQL to ensure compatibility

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
    hsk_level: 1, 
    frequency: 7,
    definitions: [
      { definition: 'you', part_of_speech: 'pron', order: 1 }
    ]
  },
  { 
    character: '好', 
    pinyin: 'hǎo', 
    strokes: 6, 
    radical: '女', 
    hsk_level: 1, 
    frequency: 20,
    definitions: [
      { definition: 'good', part_of_speech: 'adj', order: 1 },
      { definition: 'well', part_of_speech: 'adv', order: 2 },
      { definition: 'to be fond of', part_of_speech: 'v', order: 3 }
    ]
  },
  { 
    character: '我', 
    pinyin: 'wǒ', 
    strokes: 7, 
    radical: '戈', 
    hsk_level: 1, 
    frequency: 4,
    definitions: [
      { definition: 'I, me', part_of_speech: 'pron', order: 1 },
      { definition: 'my, mine', part_of_speech: 'pron', order: 2 }
    ]
  },
  { 
    character: '是', 
    pinyin: 'shì', 
    strokes: 9, 
    radical: '日', 
    hsk_level: 1, 
    frequency: 2,
    definitions: [
      { definition: 'to be', part_of_speech: 'v', order: 1 },
      { definition: 'yes', part_of_speech: 'adv', order: 2 }
    ]
  },
  { 
    character: '爱', 
    pinyin: 'ài', 
    strokes: 10, 
    radical: '爪', 
    hsk_level: 1, 
    frequency: 114,
    definitions: [
      { definition: 'to love', part_of_speech: 'v', order: 1 },
      { definition: 'affection', part_of_speech: 'n', order: 2 }
    ]
  },
  // Add two more characters
  { 
    character: '中', 
    pinyin: 'zhōng', 
    strokes: 4, 
    radical: '丨', 
    hsk_level: 1, 
    frequency: 10,
    definitions: [
      { definition: 'middle', part_of_speech: 'n', order: 1 },
      { definition: 'center', part_of_speech: 'n', order: 2 },
      { definition: 'China', part_of_speech: 'n', order: 3 }
    ]
  },
  { 
    character: '学', 
    pinyin: 'xué', 
    strokes: 8, 
    radical: '子', 
    hsk_level: 1, 
    frequency: 15,
    definitions: [
      { definition: 'to learn', part_of_speech: 'v', order: 1 },
      { definition: 'study', part_of_speech: 'n', order: 2 }
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
    const { character, pinyin, strokes, radical, hsk_level, frequency, definitions } = characterData;
    
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
        [pinyin, strokes, radical, hsk_level, frequency, characterId]
      );
      stats.charactersUpdated++;
      // console.log(`Updated character: ${character}`);
    } else {
      // Add new character
      const result = await client.query(
        'INSERT INTO characters (character, pinyin, strokes, radical, hsk_level, frequency) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [character, pinyin, strokes, radical, hsk_level, frequency]
      );
      characterId = result.rows[0].id;
      stats.charactersAdded++;
      // console.log(`Added character: ${character}`);
    }
    
    // Add definitions (check for duplicates)
    for (const def of definitions) {
      // Check if this definition already exists for this character
      const existingDefCheck = await client.query(
        'SELECT id FROM character_definitions WHERE character_id = $1 AND definition = $2 AND part_of_speech = $3',
        [characterId, def.definition, def.part_of_speech]
      );
      
      if (existingDefCheck.rows.length === 0) {
        // Only add if it doesn't already exist
        await client.query(
          'INSERT INTO character_definitions (character_id, definition, part_of_speech, "order") VALUES ($1, $2, $3, $4)',
          [characterId, def.definition, def.part_of_speech, def.order]
        );
        stats.definitionsAdded++;
      } else {
        // console.log(`Skipped duplicate definition for ${character}: "${def.definition}"`);
      }
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
  // console.log('Starting enhanced sample Chinese character import...');
  
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