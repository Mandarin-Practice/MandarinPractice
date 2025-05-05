// Script to add missing single characters from compounds
import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Stats for tracking progress
let stats = {
  charactersAdded: 0,
  errors: 0
};

// Function to extract and add missing characters
async function addMissingCharacters() {
  try {
    console.log('Identifying missing characters...');
    
    // Find all unique characters in compound words
    const missingCharsQuery = `
      WITH compound_chars AS (
        SELECT DISTINCT regexp_split_to_table(character, '') as char
        FROM characters 
        WHERE LENGTH(character) > 1 AND character ~ '^[\\u4e00-\\u9fff]+$'
      ),
      missing_chars AS (
        SELECT cc.char
        FROM compound_chars cc
        LEFT JOIN characters c ON c.character = cc.char
        WHERE c.id IS NULL AND cc.char ~ '^[\\u4e00-\\u9fff]$'
      )
      SELECT char FROM missing_chars
    `;
    
    const missingCharsResult = await pool.query(missingCharsQuery);
    const missingChars = missingCharsResult.rows;
    
    console.log(`Found ${missingChars.length} missing characters to add`);
    
    // Add each missing character to the database
    let added = 0;
    for (const charObj of missingChars) {
      try {
        const char = charObj.char;
        
        // Add the character with basic information
        await pool.query(
          `INSERT INTO characters (character, pinyin, created_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (character) DO NOTHING`,
          [char, ''] // Empty pinyin for now
        );
        
        added++;
        
        // Log progress periodically
        if (added % 100 === 0) {
          console.log(`Added ${added}/${missingChars.length} characters...`);
        }
      } catch (err) {
        console.error(`Error adding character ${charObj.char}:`, err);
        stats.errors++;
      }
    }
    
    stats.charactersAdded = added;
    console.log(`Added ${added} missing characters successfully`);
    
    return { charactersAdded: added };
  } catch (err) {
    console.error('Error adding missing characters:', err);
    return { error: err.message };
  }
}

// Main execution
async function main() {
  console.log('Starting missing character addition...');
  
  try {
    const results = await addMissingCharacters();
    
    // Print summary
    console.log('\nProcess completed successfully!');
    console.log('Summary:');
    console.log(`- Characters added: ${results.charactersAdded}`);
    console.log(`- Errors encountered: ${stats.errors}`);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error in main process:', err);
    await pool.end();
    process.exit(1);
  }
}

// Start the process
main();