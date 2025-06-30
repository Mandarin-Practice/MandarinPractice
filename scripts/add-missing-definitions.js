// Script to add basic definitions for characters missing them
import pkg from 'pg';
const { Pool } = pkg;
import OpenAI from 'openai';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable not set');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Stats for tracking progress
let stats = {
  definitionsAdded: 0,
  charactersProcessed: 0,
  errors: 0
};

// Batch size for processing
const BATCH_SIZE = 20;

// Function to generate a definition for a character using OpenAI
async function generateDefinitionWithAI(character) {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a Chinese language expert. Provide brief, accurate definitions for Chinese characters. " +
            "Return only the English definition without any Chinese characters or pinyin in your response. " +
            "Keep definitions concise (under 50 characters) and focus on the most common meanings."
        },
        {
          role: "user",
          content: `Provide a concise definition for the Chinese character: ${character}`
        }
      ],
      max_tokens: 50,
      temperature: 0.3
    });

    const definition = response.choices[0].message.content.trim();
    return definition;
  } catch (error) {
    console.error(`Error generating definition for ${character}: ${error.message}`);
    stats.errors++;
    return null;
  }
}

// Function to add missing definitions
async function addMissingDefinitions() {
  try {
    // console.log('Finding characters without definitions...');
    
    // Get characters without definitions
    const missingDefsQuery = `
      SELECT c.id, c.character
      FROM characters c
      WHERE LENGTH(c.character) = 1
      AND c.character ~ '^[\\u4e00-\\u9fff]$'
      AND NOT EXISTS (
        SELECT 1 FROM character_definitions d
        WHERE d.character_id = c.id
      )
      LIMIT 100
    `;
    
    const missingDefsResult = await pool.query(missingDefsQuery);
    const charactersWithoutDefs = missingDefsResult.rows;
    
    // console.log(`Found ${charactersWithoutDefs.length} characters without definitions`);
    
    // Process characters in batches
    for (let i = 0; i < charactersWithoutDefs.length; i += BATCH_SIZE) {
      const batch = charactersWithoutDefs.slice(i, i + BATCH_SIZE);
      // console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(charactersWithoutDefs.length/BATCH_SIZE)}`);
      
      // Process characters in parallel within each batch
      const batchPromises = batch.map(async (char) => {
        try {
          // Generate definition using OpenAI
          const definition = await generateDefinitionWithAI(char.character);
          
          if (definition) {
            // Add the definition to the database
            await pool.query(
              `INSERT INTO character_definitions (character_id, definition, "order")
               VALUES ($1, $2, 1)
               ON CONFLICT (character_id, definition) DO NOTHING`,
              [char.id, definition]
            );
            
            // console.log(`Added definition for ${char.character}: "${definition}"`);
            stats.definitionsAdded++;
          }
          
          stats.charactersProcessed++;
        } catch (err) {
          console.error(`Error processing character ${char.character}:`, err);
          stats.errors++;
        }
      });
      
      // Wait for all characters in this batch to be processed
      await Promise.all(batchPromises);
      
      // console.log(`Completed batch ${Math.floor(i/BATCH_SIZE) + 1}, added ${stats.definitionsAdded} definitions so far`);
    }
    
    return { 
      definitionsAdded: stats.definitionsAdded,
      charactersProcessed: stats.charactersProcessed 
    };
  } catch (err) {
    console.error('Error adding missing definitions:', err);
    return { error: err.message };
  }
}

// Main execution
async function main() {
  // console.log('Starting missing definitions addition...');
  
  try {
    const results = await addMissingDefinitions();
    
    // Print summary
    // console.log('\nProcess completed successfully!');
    // console.log('Summary:');
    // console.log(`- Characters processed: ${results.charactersProcessed}`);
    // console.log(`- Definitions added: ${results.definitionsAdded}`);
    // console.log(`- Errors encountered: ${stats.errors}`);
    
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