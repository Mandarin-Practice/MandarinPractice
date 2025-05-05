// Import script for CC-CEDICT Chinese dictionary data
// CC-CEDICT is a free Chinese-English dictionary with >100,000 entries
// Data source: https://www.mdbg.net/chinese/dictionary?page=cedict

const fs = require('fs');
const https = require('https');
const readline = require('readline');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');

// Configure database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Define the URL for the CC-CEDICT dictionary file
const CEDICT_URL = 'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz';
const TEMP_FILE_PATH = './cedict_data.txt.gz';

// Function to download the file
async function downloadFile(url, destination) {
  console.log(`Downloading dictionary data from ${url}...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download completed');
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination);
      reject(err);
    });
  });
}

// Function to extract and process the file
async function processFile() {
  console.log('Extracting and processing dictionary data...');
  
  // Unzip and process the file
  const { exec } = require('child_process');
  exec(`gunzip -c ${TEMP_FILE_PATH} > cedict_data.txt`, async (error) => {
    if (error) {
      console.error('Error extracting file:', error);
      return;
    }
    
    console.log('File extracted, now processing entries...');
    
    // Now read and process the unzipped file
    const fileStream = fs.createReadStream('cedict_data.txt');
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let charactersAdded = 0;
    let definitionsAdded = 0;
    
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
        
        // Add each character from simplified and traditional
        await addCharacter(simplified, pinyin);
        // Also add traditional if different
        if (simplified !== traditional) {
          await addCharacter(traditional, pinyin);
        }
        
        charactersAdded++;
        
        if (charactersAdded % 1000 === 0) {
          console.log(`Processed ${charactersAdded} characters...`);
        }
      } catch (err) {
        console.error('Error processing line:', line, err);
      }
    }
    
    console.log(`Import completed: Added ${charactersAdded} characters and ${definitionsAdded} definitions.`);
    
    // Clean up temp files
    fs.unlinkSync(TEMP_FILE_PATH);
    fs.unlinkSync('cedict_data.txt');
    
    process.exit(0);
  });
}

// Function to add a character to the database
async function addCharacter(character, pinyin) {
  try {
    // Check if character already exists
    const [existingChar] = await db.execute({
      sql: 'SELECT id FROM characters WHERE character = $1',
      args: [character]
    });
    
    if (existingChar && existingChar.id) {
      return existingChar.id;
    }
    
    // Add new character
    const [newChar] = await db.execute({
      sql: 'INSERT INTO characters (character, pinyin) VALUES ($1, $2) RETURNING id',
      args: [character, pinyin]
    });
    
    return newChar.id;
  } catch (err) {
    console.error(`Error adding character ${character}:`, err);
    return null;
  }
}

// Function to add a definition to the database
async function addDefinition(characterId, definition, partOfSpeech, order) {
  try {
    // Extract part of speech if present (usually in parentheses at start of definition)
    let pos = null;
    const posMatch = definition.match(/^\(([a-zA-Z,\s]+)\)/);
    if (posMatch) {
      pos = posMatch[1];
      definition = definition.substring(posMatch[0].length).trim();
    }
    
    // Add definition
    await db.execute({
      sql: 'INSERT INTO character_definitions (character_id, definition, part_of_speech, "order") VALUES ($1, $2, $3, $4)',
      args: [characterId, definition, pos || partOfSpeech, order]
    });
    
    return true;
  } catch (err) {
    console.error(`Error adding definition for character ${characterId}:`, err);
    return false;
  }
}

// Main execution
async function main() {
  try {
    await downloadFile(CEDICT_URL, TEMP_FILE_PATH);
    await processFile();
  } catch (err) {
    console.error('Error in main process:', err);
    process.exit(1);
  }
}

main();