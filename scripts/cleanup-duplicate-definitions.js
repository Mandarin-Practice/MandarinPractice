#!/usr/bin/env node
// This script removes duplicate definitions from the database

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

async function removeDuplicateDefinitions() {
  const client = await pool.connect();
  
  try {
    // console.log('Identifying duplicate definitions...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get all characters with definitions
    const characters = await client.query('SELECT id, character FROM characters');
    // console.log(`Found ${characters.rows.length} characters to check for duplicate definitions`);
    
    let totalDuplicatesRemoved = 0;
    
    // For each character, find and remove duplicate definitions
    for (const char of characters.rows) {
      // console.log(`Checking ${char.character} (ID: ${char.id}) for duplicates...`);
      
      // Find definitions with the same text for this character
      const duplicatesQuery = await client.query(`
        WITH grouped_defs AS (
          SELECT 
            definition, 
            part_of_speech,
            MIN(id) as keep_id,
            array_agg(id) as all_ids
          FROM character_definitions
          WHERE character_id = $1
          GROUP BY definition, part_of_speech
          HAVING COUNT(*) > 1
        )
        SELECT 
          definition, 
          part_of_speech,
          keep_id,
          array_remove(all_ids, keep_id) as delete_ids
        FROM grouped_defs
      `, [char.id]);
      
      // Delete the duplicates (keeping the one with the lowest ID)
      for (const dup of duplicatesQuery.rows) {
        if (dup.delete_ids.length > 0) {
          // console.log(`Found ${dup.delete_ids.length} duplicates for "${dup.definition}" (${dup.part_of_speech})`);
          
          // Delete the duplicates
          await client.query(`
            DELETE FROM character_definitions 
            WHERE id = ANY($1::int[])
          `, [dup.delete_ids]);
          
          totalDuplicatesRemoved += dup.delete_ids.length;
        }
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // console.log(`\nCleanup completed successfully!`);
    // console.log(`Removed ${totalDuplicatesRemoved} duplicate definitions`);
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error removing duplicates:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Main function
async function main() {
  // console.log('Starting duplicate definition cleanup...');
  
  try {
    await removeDuplicateDefinitions();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error in main process:', err);
    await pool.end();
    process.exit(1);
  }
}

// Start the cleanup process
main();