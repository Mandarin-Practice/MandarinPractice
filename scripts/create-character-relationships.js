// Script to create relationships between characters and compounds
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Stats for tracking progress
let stats = {
  compoundsProcessed: 0,
  relationshipsCreated: 0,
  errors: 0
};

// Function to create relationships between characters and compounds
async function createCharacterRelationships() {
  try {
    // Get all characters from the database
    console.log('Fetching all characters from database...');
    const allCharsResult = await pool.query(
      "SELECT id, character FROM characters WHERE character ~ '^[\\u4e00-\\u9fff]+$' ORDER BY id"
    );
    const allChars = allCharsResult.rows;
    console.log(`Found ${allChars.length} characters to process for relationships`);
    
    // Create a map for faster lookups
    const charMap = new Map();
    allChars.forEach(char => {
      charMap.set(char.character, char.id);
    });
    
    // Get single characters for component mapping
    const singleCharsResult = await pool.query(
      "SELECT id, character FROM characters WHERE LENGTH(character) = 1 AND character ~ '^[\\u4e00-\\u9fff]$'"
    );
    const singleChars = singleCharsResult.rows;
    console.log(`Found ${singleChars.length} single characters for components`);
    
    // Create another map for single characters
    const singleCharMap = new Map();
    singleChars.forEach(char => {
      singleCharMap.set(char.character, char.id);
    });
    
    // Start a counter for logging
    let compoundsProcessed = 0;
    let relationshipsCreated = 0;
    
    // Get current progress to resume
    const progressResult = await pool.query(
      "SELECT MAX(compound_id) as last_compound_id FROM character_compounds"
    );
    const lastCompoundId = progressResult.rows[0].last_compound_id || 0;
    console.log(`Resuming from compound ID: ${lastCompoundId}`);
    
    // Process multi-character compounds, starting from where we left off
    const multiCharsResult = await pool.query(
      "SELECT id, character FROM characters WHERE LENGTH(character) > 1 AND character ~ '^[\\u4e00-\\u9fff]+$' AND id > $1 ORDER BY id LIMIT 2000",
      [lastCompoundId]
    );
    const multiChars = multiCharsResult.rows;
    console.log(`Processing ${multiChars.length} multi-character compounds`);
    
    // Prepare batch inserts to improve performance
    const relationshipsToCreate = [];
    
    for (const compound of multiChars) {
      // Break compound into individual characters
      const compoundChars = Array.from(compound.character);
      
      for (let position = 0; position < compoundChars.length; position++) {
        const component = compoundChars[position];
        
        // Make sure the component character exists in our single character map
        if (singleCharMap.has(component)) {
          const componentId = singleCharMap.get(component);
          
          // Store this relationship for batch insertion
          relationshipsToCreate.push({
            compoundId: compound.id,
            componentId: componentId,
            position: position
          });
        }
      }
      
      compoundsProcessed++;
      
      // Log progress periodically
      if (compoundsProcessed % 100 === 0) {
        console.log(`Prepared ${compoundsProcessed}/${multiChars.length} compounds, found ${relationshipsToCreate.length} potential relationships...`);
      }
    }
    
    console.log(`\nPrepared ${relationshipsToCreate.length} potential relationships. Now filtering duplicates...`);
    
    // Process in batches of 500 for better performance
    const batchSize = 500;
    for (let i = 0; i < relationshipsToCreate.length; i += batchSize) {
      const batch = relationshipsToCreate.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(relationshipsToCreate.length/batchSize)}`);
      
      for (const rel of batch) {
        // Check if this relationship already exists to avoid duplicates
        const existingRel = await pool.query(
          'SELECT id FROM character_compounds WHERE compound_id = $1 AND component_id = $2 AND position = $3',
          [rel.compoundId, rel.componentId, rel.position]
        );
        
        if (existingRel.rows.length === 0) {
          // Create the relationship
          await pool.query(
            'INSERT INTO character_compounds (compound_id, component_id, position) VALUES ($1, $2, $3)',
            [rel.compoundId, rel.componentId, rel.position]
          );
          relationshipsCreated++;
          
          // Log progress periodically
          if (relationshipsCreated % 100 === 0) {
            console.log(`Created ${relationshipsCreated} relationships...`);
          }
        }
      }
    }
    
    console.log(`\nCompound relationship processing complete!`);
    console.log(`- Compounds processed: ${compoundsProcessed}`);
    console.log(`- Relationships created: ${relationshipsCreated}`);
    
    return { compoundsProcessed, relationshipsCreated };
  } catch (err) {
    console.error('Error creating character relationships:', err);
    stats.errors++;
    return { error: err.message };
  }
}

// Main execution
async function main() {
  console.log('Starting character relationship creation...');
  
  try {
    const results = await createCharacterRelationships();
    
    // Print summary
    console.log('\nProcess completed successfully!');
    console.log('Summary:');
    console.log(`- Compounds processed: ${results.compoundsProcessed}`);
    console.log(`- Relationships created: ${results.relationshipsCreated}`);
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