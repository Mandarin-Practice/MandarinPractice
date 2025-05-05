#!/usr/bin/env node
// Master script to import all character and dictionary data
// Combines CC-CEDICT and HanziDB data to create a comprehensive Chinese dictionary

// Use ES Modules
import fs from 'fs';
import https from 'https';
import readline from 'readline';
import csvParser from 'csv-parser';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, like, or } from 'drizzle-orm';
import ws from 'ws';
import { exec } from 'child_process';
import path from 'path';
import * as schema from '../shared/schema.js';

// Configure neonConfig for WebSockets
neonConfig.webSocketConstructor = ws;

// Configure database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Define the URLs for source data
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const HANZIDB_URL = 'https://raw.githubusercontent.com/kfcd/hanzidb/master/data/hanzi.csv';

// Temporary file paths
const CEDICT_TEMP_PATH = './cedict_data.txt.gz';
const CEDICT_EXTRACTED_PATH = './cedict_data.txt';
const HANZIDB_TEMP_PATH = './hanzi_data.csv';

// Stats for tracking progress
let stats = {
  charactersAdded: 0,
  charactersUpdated: 0,
  definitionsAdded: 0,
  errors: 0
};

// Function to download a file
async function downloadFile(url, destination) {
  console.log(`Downloading data from ${url}...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Download completed to ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination);
      reject(err);
    });
  });
}

// Function to extract a gzipped file
async function extractGzipFile(source, destination) {
  console.log(`Extracting ${source} to ${destination}...`);
  
  return new Promise((resolve, reject) => {
    exec(`gunzip -c ${source} > ${destination}`, (error) => {
      if (error) {
        reject(error);
        return;
      }
      console.log('Extraction completed');
      resolve();
    });
  });
}

// Process HanziDB CSV file to get character details
async function processHanziData() {
  console.log('Processing HanziDB data...');
  
  const hanziMap = new Map(); // Map character to its data
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(HANZIDB_TEMP_PATH)
      .pipe(csv())
      .on('data', (data) => {
        hanziMap.set(data.character, {
          character: data.character,
          pinyin: data.pinyin || '',
          strokes: parseInt(data.stroke_count) || null,
          radical: data.radical || null,
          hskLevel: data.hsk ? parseInt(data.hsk) : null,
          frequency: data.frequency_rank ? parseInt(data.frequency_rank) : null
        });
      })
      .on('end', () => {
        console.log(`Loaded ${hanziMap.size} characters from HanziDB`);
        resolve(hanziMap);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Function to process CC-CEDICT data
async function processCedictData(hanziMap) {
  console.log('Processing CC-CEDICT data...');
  
  const fileStream = fs.createReadStream(CEDICT_EXTRACTED_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  // Counter for line processing (more accurate for progress)
  let processedEntries = 0;
  
  // Process each line
  for await (const line of rl) {
    // Skip comments
    if (line.startsWith('#')) continue;
    
    try {
      // Parse CC-CEDICT line format: simplified traditional [pinyin] /definition 1/definition 2/
      const match = line.match(/^(\S+) (\S+) \[(.*?)\] \/(.+)\/$/);
      if (!match) continue;
      
      const [_, simplified, traditional, pinyin, definitionsStr] = match;
      const definitions = definitionsStr.split('/').filter(d => d.trim());
      
      // Process simplified character
      const simplifiedCharId = await addOrUpdateCharacter(simplified, pinyin, hanziMap.get(simplified));
      
      // Add definitions for simplified character
      if (simplifiedCharId) {
        let order = 1;
        for (const def of definitions) {
          await addDefinition(simplifiedCharId, def, order++);
        }
      }
      
      // Process traditional character if different
      if (simplified !== traditional) {
        const traditionalCharId = await addOrUpdateCharacter(traditional, pinyin, hanziMap.get(traditional));
        
        // Add the same definitions for traditional character
        if (traditionalCharId) {
          let order = 1;
          for (const def of definitions) {
            await addDefinition(traditionalCharId, def, order++);
          }
        }
      }
      
      // Update and log progress
      processedEntries++;
      if (processedEntries % 1000 === 0) {
        console.log(`Processed ${processedEntries} entries, added ${stats.definitionsAdded} definitions, characters: ${stats.charactersAdded}...`);
      }
    } catch (err) {
      stats.errors++;
      console.error('Error processing line:', line, err);
    }
  }
}

// Function to add or update a character in the database
async function addOrUpdateCharacter(character, pinyin, hanziData) {
  try {
    // Use Drizzle's API with the schema
    const { characters } = schema;
    
    // Check if character already exists
    const existingChars = await db.select().from(characters).where(eq(characters.character, character));
    const existingChar = existingChars[0];
    
    if (existingChar) {
      // Update with HanziDB data if available
      if (hanziData) {
        await db.update(characters)
          .set({
            pinyin: pinyin,
            strokes: hanziData.strokes,
            radical: hanziData.radical,
            hskLevel: hanziData.hskLevel,
            frequency: hanziData.frequency
          })
          .where(eq(characters.id, existingChar.id))
          .execute();
        
        stats.charactersUpdated++;
      }
      return existingChar.id;
    }
    
    // Add new character
    const newChars = await db.insert(characters)
      .values({
        character: character,
        pinyin: pinyin,
        strokes: hanziData ? hanziData.strokes : null,
        radical: hanziData ? hanziData.radical : null,
        hskLevel: hanziData ? hanziData.hskLevel : null,
        frequency: hanziData ? hanziData.frequency : null
      })
      .returning();
    
    stats.charactersAdded++;
    return newChars[0].id;
  } catch (err) {
    console.error(`Error adding/updating character ${character}:`, err);
    stats.errors++;
    return null;
  }
}

// Function to add a definition to the database
async function addDefinition(characterId, definition, order) {
  try {
    // Use schema
    const { characterDefinitions } = schema;
    
    // Extract part of speech if present (usually in parentheses at start of definition)
    let pos = null;
    const posMatch = definition.match(/^\(([a-zA-Z,\s]+)\)/);
    if (posMatch) {
      pos = posMatch[1];
      definition = definition.substring(posMatch[0].length).trim();
    }
    
    // Add definition using Drizzle
    await db.insert(characterDefinitions)
      .values({
        characterId: characterId,
        definition: definition,
        partOfSpeech: pos,
        order: order
      })
      .execute();
    
    stats.definitionsAdded++;
    return true;
  } catch (err) {
    console.error(`Error adding definition for character ${characterId}:`, err);
    stats.errors++;
    return false;
  }
}

// Function to clean up temporary files
function cleanup() {
  try {
    if (fs.existsSync(CEDICT_TEMP_PATH)) fs.unlinkSync(CEDICT_TEMP_PATH);
    if (fs.existsSync(CEDICT_EXTRACTED_PATH)) fs.unlinkSync(CEDICT_EXTRACTED_PATH);
    if (fs.existsSync(HANZIDB_TEMP_PATH)) fs.unlinkSync(HANZIDB_TEMP_PATH);
    console.log('Temporary files cleaned up');
  } catch (err) {
    console.error('Error cleaning up temporary files:', err);
  }
}

// Main execution
async function main() {
  console.log('Starting comprehensive Chinese dictionary import...');
  
  try {
    // Download HanziDB data
    await downloadFile(HANZIDB_URL, HANZIDB_TEMP_PATH);
    const hanziMap = await processHanziData();
    
    // Download and extract CC-CEDICT data
    await downloadFile(CEDICT_URL, CEDICT_TEMP_PATH);
    await extractGzipFile(CEDICT_TEMP_PATH, CEDICT_EXTRACTED_PATH);
    
    // Process CC-CEDICT data with HanziDB enrichment
    await processCedictData(hanziMap);
    
    // Clean up temporary files
    cleanup();
    
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
    cleanup();
    process.exit(1);
  }
}

// Start the import process
main();