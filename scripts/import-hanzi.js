// Import script for HanziDB data, which includes character information
// like stroke count, radical, HSK level, and frequency data
// Data source: https://github.com/kfcd/hanzidb

const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const path = require('path');

// Configure database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Define the URLs for the HanziDB files
const HANZIDB_URL = 'https://raw.githubusercontent.com/kfcd/hanzidb/master/data/hanzi.csv';
const TEMP_FILE_PATH = './hanzi_data.csv';

// Function to download the file
async function downloadFile(url, destination) {
  console.log(`Downloading data from ${url}...`);
  
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

// Function to process the HanziDB CSV file
async function processHanziFile() {
  console.log('Processing HanziDB data...');
  
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(TEMP_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`Loaded ${results.length} characters from HanziDB`);
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// Function to update character details in the database
async function updateCharacterDetails(characterData) {
  let updated = 0;
  let added = 0;
  
  for (const data of characterData) {
    try {
      const character = data.character;
      const pinyin = data.pinyin || '';
      const strokes = parseInt(data.stroke_count) || null;
      const radical = data.radical || null;
      const hskLevel = data.hsk ? parseInt(data.hsk) : null;
      const frequency = data.frequency_rank ? parseInt(data.frequency_rank) : null;
      
      // Check if character exists
      const [existingChar] = await db.execute({
        sql: 'SELECT id FROM characters WHERE character = $1',
        args: [character]
      });
      
      if (existingChar && existingChar.id) {
        // Update existing character
        await db.execute({
          sql: 'UPDATE characters SET pinyin = $1, strokes = $2, radical = $3, "hskLevel" = $4, frequency = $5 WHERE id = $6',
          args: [pinyin, strokes, radical, hskLevel, frequency, existingChar.id]
        });
        updated++;
      } else {
        // Add new character
        await db.execute({
          sql: 'INSERT INTO characters (character, pinyin, strokes, radical, "hskLevel", frequency) VALUES ($1, $2, $3, $4, $5, $6)',
          args: [character, pinyin, strokes, radical, hskLevel, frequency]
        });
        added++;
      }
      
      if ((updated + added) % 500 === 0) {
        console.log(`Processed ${updated + added} characters (${updated} updated, ${added} added)...`);
      }
    } catch (err) {
      console.error(`Error processing character ${data.character}:`, err);
    }
  }
  
  console.log(`HanziDB import completed: ${updated} characters updated, ${added} characters added.`);
}

// Main execution
async function main() {
  try {
    await downloadFile(HANZIDB_URL, TEMP_FILE_PATH);
    const hanziData = await processHanziFile();
    await updateCharacterDetails(hanziData);
    
    // Clean up temp file
    fs.unlinkSync(TEMP_FILE_PATH);
    
    console.log('All processing completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error in main process:', err);
    process.exit(1);
  }
}

main();