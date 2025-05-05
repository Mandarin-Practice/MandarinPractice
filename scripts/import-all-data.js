#!/usr/bin/env node
// Master script to import all character and dictionary data
// Combines CC-CEDICT and HanziDB data to create a comprehensive Chinese dictionary

// Use ES Modules
import fs from 'fs';
import https from 'https';
import readline from 'readline';
import csvParser from 'csv-parser';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { exec } from 'child_process';
import path from 'path';

// Configure neonConfig for WebSockets
neonConfig.webSocketConstructor = ws;

// Configure database connection
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Define the URLs for source data
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
// Use alternative URL for HanziDB as the original might be outdated
const HANZIDB_URL = 'https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt';

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

// Process Hanzi dictionary file to get character details
async function processHanziData() {
  console.log('Processing Hanzi dictionary data...');
  
  const hanziMap = new Map(); // Map character to its data
  
  return new Promise((resolve, reject) => {
    // Read the file line by line
    const fileStream = fs.createReadStream(HANZIDB_TEMP_PATH);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    // Process each line
    rl.on('line', (line) => {
      try {
        // Parse the JSON data
        const data = JSON.parse(line);
        if (data.character && data.pinyin) {
          hanziMap.set(data.character, {
            character: data.character,
            pinyin: data.pinyin.join(' '), // Join multiple pinyin readings
            strokes: data.strokes || null,
            radical: data.radical || null,
            hskLevel: null, // Not available in this dataset
            frequency: data.frequency || null
          });
        }
      } catch (err) {
        console.error('Error parsing line:', line.substring(0, 50) + '...', err);
      }
    });
    
    // When all lines are processed
    rl.on('close', () => {
      console.log(`Loaded ${hanziMap.size} characters from Hanzi dictionary`);
      resolve(hanziMap);
    });
    
    // Handle errors
    rl.on('error', (err) => {
      console.error('Error reading Hanzi dictionary:', err);
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
    // Check if character already exists using direct SQL
    const existingQuery = await pool.query(
      'SELECT id FROM characters WHERE character = $1',
      [character]
    );
    
    if (existingQuery.rows.length > 0) {
      const existingChar = existingQuery.rows[0];
      
      // Update with HanziDB data if available
      if (hanziData) {
        await pool.query(
          `UPDATE characters 
           SET pinyin = $1, 
               strokes = $2, 
               radical = $3, 
               hsk_level = $4, 
               frequency = $5
           WHERE id = $6`,
          [
            pinyin,
            hanziData.strokes,
            hanziData.radical,
            hanziData.hskLevel,
            hanziData.frequency,
            existingChar.id
          ]
        );
        
        stats.charactersUpdated++;
      }
      return existingChar.id;
    }
    
    // Add new character with direct SQL
    const newCharQuery = await pool.query(
      `INSERT INTO characters 
       (character, pinyin, strokes, radical, hsk_level, frequency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        character,
        pinyin,
        hanziData ? hanziData.strokes : null,
        hanziData ? hanziData.radical : null,
        hanziData ? hanziData.hskLevel : null,
        hanziData ? hanziData.frequency : null
      ]
    );
    
    stats.charactersAdded++;
    return newCharQuery.rows[0].id;
  } catch (err) {
    console.error(`Error adding/updating character ${character}:`, err);
    stats.errors++;
    return null;
  }
}

// Function to add a definition to the database
async function addDefinition(characterId, definition, order) {
  try {
    // Extract part of speech if present (usually in parentheses at start of definition)
    let pos = null;
    const posMatch = definition.match(/^\(([a-zA-Z,\s]+)\)/);
    if (posMatch) {
      pos = posMatch[1];
      definition = definition.substring(posMatch[0].length).trim();
    }
    
    // Check for existing definition with same text to avoid duplicates
    const existingDefQuery = await pool.query(
      'SELECT id FROM character_definitions WHERE character_id = $1 AND definition = $2 AND COALESCE(part_of_speech, \'\') = COALESCE($3, \'\')',
      [characterId, definition, pos]
    );
    
    if (existingDefQuery.rows.length > 0) {
      // Definition already exists, skip
      return true;
    }
    
    // Add definition using direct SQL
    await pool.query(
      `INSERT INTO character_definitions 
       (character_id, definition, part_of_speech, "order")
       VALUES ($1, $2, $3, $4)`,
      [characterId, definition, pos, order]
    );
    
    stats.definitionsAdded++;
    return true;
  } catch (err) {
    console.error(`Error adding definition for character ${characterId}:`, err);
    stats.errors++;
    return false;
  }
}

// Function to create relationships between characters and compounds
async function createCharacterRelationships() {
  try {
    // Get all characters from the database
    const allCharsResult = await pool.query('SELECT id, character FROM characters ORDER BY id');
    const allChars = allCharsResult.rows;
    console.log(`Found ${allChars.length} characters to process for relationships`);
    
    // Create a map for faster lookups
    const charMap = new Map();
    allChars.forEach(char => {
      charMap.set(char.character, char.id);
    });
    
    // Start a counter for logging
    let compoundsProcessed = 0;
    let relationshipsCreated = 0;
    
    // Process all multi-character compounds
    for (const char of allChars) {
      // Skip single characters (no components)
      if (char.character.length <= 1) continue;
      
      compoundsProcessed++;
      
      // Break compound into individual characters
      const compoundChars = Array.from(char.character);
      let position = 0;
      
      for (const component of compoundChars) {
        // Make sure the component character exists in our database
        if (charMap.has(component)) {
          const componentId = charMap.get(component);
          
          // Check if this relationship already exists to avoid duplicates
          const existingRel = await pool.query(
            'SELECT id FROM character_compounds WHERE compound_id = $1 AND component_id = $2 AND position = $3',
            [char.id, componentId, position]
          );
          
          if (existingRel.rows.length === 0) {
            // Create the relationship
            await pool.query(
              'INSERT INTO character_compounds (compound_id, component_id, position) VALUES ($1, $2, $3)',
              [char.id, componentId, position]
            );
            relationshipsCreated++;
          }
        }
        
        position++;
      }
      
      // Log progress periodically
      if (compoundsProcessed % 1000 === 0) {
        console.log(`Processed ${compoundsProcessed} compounds, created ${relationshipsCreated} relationships...`);
      }
    }
    
    console.log(`\nCompound relationship processing complete!`);
    console.log(`- Compounds processed: ${compoundsProcessed}`);
    console.log(`- Relationships created: ${relationshipsCreated}`);
    
    return true;
  } catch (err) {
    console.error('Error creating character relationships:', err);
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
    
    // Create relationships between characters and multi-character compounds
    console.log('Creating relationships between characters and compound words...');
    await createCharacterRelationships();
    
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