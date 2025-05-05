// Script to fix "variant of" definitions with actual meanings
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
  definitionsUpdated: 0,
  definitionsSkipped: 0,
  errors: 0
};

// Batch size for processing
const BATCH_SIZE = 10;

// Extract the referenced character from "variant of X[...]" definitions
function extractReferencedCharacter(definition) {
  const match = definition.match(/variant of ([^\[]+)/);
  if (match && match[1]) {
    // Handle cases with vertical bars (traditional/simplified variants)
    const chars = match[1].split('|');
    return chars[0].trim();
  }
  return null;
}

// Function to generate a proper definition using OpenAI
async function generateDefinition(character, variantOf) {
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
          content: `The character "${character}" is a variant of "${variantOf}". Please provide a concise definition that explains the character's meaning, without just saying it's a variant.`
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

// Function to find the definition of a referenced character
async function findReferencedCharacterDefinition(character) {
  try {
    const result = await pool.query(
      `SELECT cd.definition
       FROM characters c
       JOIN character_definitions cd ON c.id = cd.character_id
       WHERE c.character = $1
       AND cd.definition NOT LIKE 'variant of%'
       ORDER BY cd."order"
       LIMIT 1`,
      [character]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].definition;
    }
    return null;
  } catch (error) {
    console.error(`Error finding definition for ${character}: ${error.message}`);
    return null;
  }
}

// Main function to fix variant definitions
async function fixVariantDefinitions() {
  try {
    console.log('Finding definitions with "variant of" pattern...');
    
    // Get all definitions with the "variant of" pattern
    const variantDefsResult = await pool.query(
      `SELECT cd.id, c.character, cd.definition
       FROM character_definitions cd
       JOIN characters c ON cd.character_id = c.id
       WHERE cd.definition LIKE 'variant of%'`
    );
    
    const variantDefs = variantDefsResult.rows;
    console.log(`Found ${variantDefs.length} "variant of" definitions to fix`);
    
    // Process definitions in batches
    for (let i = 0; i < variantDefs.length; i += BATCH_SIZE) {
      const batch = variantDefs.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(variantDefs.length/BATCH_SIZE)}`);
      
      // Process each definition one by one
      for (const def of batch) {
        try {
          console.log(`Processing: ${def.character} (${def.definition})`);
          
          // Extract the referenced character
          const referencedChar = extractReferencedCharacter(def.definition);
          
          if (referencedChar) {
            console.log(`Referenced character: ${referencedChar}`);
            
            // First try to find the definition of the referenced character
            const referencedDef = await findReferencedCharacterDefinition(referencedChar);
            
            if (referencedDef) {
              // If found, update with "same as X: [definition]"
              const newDefinition = `same as ${referencedChar}: ${referencedDef}`;
              
              await pool.query(
                `UPDATE character_definitions
                 SET definition = $1, updated_at = NOW()
                 WHERE id = $2`,
                [newDefinition, def.id]
              );
              
              console.log(`Updated definition for ${def.character}: "${newDefinition}"`);
              stats.definitionsUpdated++;
            } else {
              // If no referenced definition found, generate a new one with AI
              const generatedDef = await generateDefinition(def.character, referencedChar);
              
              if (generatedDef) {
                await pool.query(
                  `UPDATE character_definitions
                   SET definition = $1, updated_at = NOW()
                   WHERE id = $2`,
                  [generatedDef, def.id]
                );
                
                console.log(`Generated new definition for ${def.character}: "${generatedDef}"`);
                stats.definitionsUpdated++;
              } else {
                stats.definitionsSkipped++;
              }
            }
          } else {
            console.log(`Could not extract referenced character from: ${def.definition}`);
            stats.definitionsSkipped++;
          }
        } catch (err) {
          console.error(`Error processing definition for ${def.character}:`, err);
          stats.errors++;
        }
      }
      
      console.log(`Batch ${Math.floor(i/BATCH_SIZE) + 1} complete, updated ${stats.definitionsUpdated} definitions so far`);
    }
    
    return { 
      definitionsUpdated: stats.definitionsUpdated,
      definitionsSkipped: stats.definitionsSkipped
    };
  } catch (err) {
    console.error('Error fixing variant definitions:', err);
    return { error: err.message };
  }
}

// Main execution
async function main() {
  console.log('Starting variant definition fixes...');
  
  try {
    const results = await fixVariantDefinitions();
    
    // Print summary
    console.log('\nProcess completed successfully!');
    console.log('Summary:');
    console.log(`- Definitions updated: ${results.definitionsUpdated}`);
    console.log(`- Definitions skipped: ${results.definitionsSkipped}`);
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