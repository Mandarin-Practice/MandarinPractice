#!/usr/bin/env node
// Import a small sample of common Chinese characters for testing

// Use ES modules 
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import * as schema from '../shared/schema.ts';

// Configure neonConfig for WebSockets
neonConfig.webSocketConstructor = ws;

// Configure database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

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

// Function to add a character
async function addCharacter(characterData) {
  try {
    const { character, pinyin, strokes, radical, hskLevel, frequency, definitions } = characterData;
    const { characters } = schema;
    
    // Check if character already exists
    const existingChars = await db.select().from(characters).where(eq(characters.character, character));
    const existingChar = existingChars[0];
    
    let characterId;
    
    if (existingChar) {
      // Update character
      await db.update(characters)
        .set({
          pinyin,
          strokes,
          radical,
          hskLevel,
          frequency
        })
        .where(eq(characters.id, existingChar.id));
      
      stats.charactersUpdated++;
      characterId = existingChar.id;
      console.log(`Updated character: ${character}`);
    } else {
      // Add new character
      const newChars = await db.insert(characters)
        .values({
          character,
          pinyin,
          strokes,
          radical,
          hskLevel,
          frequency
        })
        .returning();
      
      stats.charactersAdded++;
      characterId = newChars[0].id;
      console.log(`Added character: ${character}`);
    }
    
    // Add definitions
    const { characterDefinitions } = schema;
    for (const def of definitions) {
      await db.insert(characterDefinitions)
        .values({
          characterId,
          definition: def.definition,
          partOfSpeech: def.partOfSpeech,
          order: def.order
        });
      
      stats.definitionsAdded++;
    }
    
    return true;
  } catch (err) {
    console.error(`Error adding character ${characterData.character}:`, err);
    stats.errors++;
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting sample Chinese character import...');
  
  try {
    // Add each sample character
    for (const charData of sampleCharacters) {
      await addCharacter(charData);
    }
    
    // Print summary
    console.log('\nImport completed successfully!');
    console.log('Summary:');
    console.log(`- Characters added: ${stats.charactersAdded}`);
    console.log(`- Characters updated: ${stats.charactersUpdated}`);
    console.log(`- Definitions added: ${stats.definitionsAdded}`);
    console.log(`- Errors encountered: ${stats.errors}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error in main process:', err);
    process.exit(1);
  }
}

// Start the import process
main();