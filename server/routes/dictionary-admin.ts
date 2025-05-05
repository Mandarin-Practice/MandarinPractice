import { Router } from 'express';
import { storage } from '../storage';
import { spawn } from 'child_process';
import { log } from '../vite';
import path from 'path';
import { db, pool } from '../db';
import * as schema from '../../shared/schema';
import { sql } from 'drizzle-orm';

const router = Router();

// Store import process state
let importProcess: any = null;
let importStatus = {
  isRunning: false,
  progress: 0,
  logs: [] as string[],
  error: null as string | null,
  stats: {
    charactersAdded: 0,
    charactersUpdated: 0,
    definitionsAdded: 0,
    errors: 0
  }
};

// SSE clients
const clients: { id: string, res: any }[] = [];

// Send updates to all connected clients
function sendUpdateToAll(data: any) {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Helper function to set up import process handlers
function setupImportProcessHandlers(process: any, res: any) {
  // Handle process output
  process.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n');
    
    for (const line of lines) {
      // Add to logs
      importStatus.logs.push(line);
      
      // Update progress based on log messages
      if (line.includes('Processed')) {
        const match = line.match(/Processed (\d+)/);
        if (match && match[1]) {
          const processed = parseInt(match[1]);
          // Assume total of about 100,000 entries
          importStatus.progress = Math.min(Math.floor(processed / 1000), 99);
        }
      }
      
      // Extract statistics
      if (line.includes('Characters added:')) {
        const match = line.match(/Characters added: (\d+)/);
        if (match && match[1]) {
          importStatus.stats.charactersAdded = parseInt(match[1]);
        }
      }
      
      if (line.includes('Characters updated:')) {
        const match = line.match(/Characters updated: (\d+)/);
        if (match && match[1]) {
          importStatus.stats.charactersUpdated = parseInt(match[1]);
        }
      }
      
      if (line.includes('Definitions added:')) {
        const match = line.match(/Definitions added: (\d+)/);
        if (match && match[1]) {
          importStatus.stats.definitionsAdded = parseInt(match[1]);
        }
      }
      
      if (line.includes('Errors encountered:')) {
        const match = line.match(/Errors encountered: (\d+)/);
        if (match && match[1]) {
          importStatus.stats.errors = parseInt(match[1]);
        }
      }
    }
    
    // Send update to clients
    sendUpdateToAll({ 
      log: lines[lines.length - 1],
      progress: importStatus.progress
    });
  });
  
  // Handle process errors
  process.stderr.on('data', (data: Buffer) => {
    const errorMsg = data.toString().trim();
    importStatus.logs.push(`ERROR: ${errorMsg}`);
    importStatus.error = errorMsg;
    
    // Send error to clients
    sendUpdateToAll({ 
      log: `ERROR: ${errorMsg}`,
      error: errorMsg
    });
  });
  
  // Handle process completion
  process.on('close', (code: number) => {
    log(`Import process exited with code ${code}`, 'dictionary-admin');
    
    importStatus.isRunning = false;
    importStatus.progress = 100;
    
    if (code === 0) {
      importStatus.logs.push('Import completed successfully!');
      sendUpdateToAll({ 
        log: 'Import completed successfully!',
        progress: 100,
        completed: true,
        stats: importStatus.stats
      });
    } else {
      importStatus.logs.push(`Import failed with exit code ${code}`);
      importStatus.error = `Process exited with code ${code}`;
      sendUpdateToAll({ 
        log: `Import failed with exit code ${code}`,
        error: `Process exited with code ${code}`,
        completed: true
      });
    }
    
    importProcess = null;
  });
  
  res.json({ success: true, message: 'Import started' });
}

// GET character count
router.get('/dictionary/stats', async (req, res) => {
  try {
    // Use direct pool query that matches PostgreSQL response format
    const characterQuery = await pool.query('SELECT COUNT(*) as count FROM characters');
    const definitionQuery = await pool.query('SELECT COUNT(*) as count FROM character_definitions');
    
    // Log the raw responses to debug
    log(`Character count raw response: ${JSON.stringify(characterQuery.rows)}`, 'dictionary-admin');
    log(`Definition count raw response: ${JSON.stringify(definitionQuery.rows)}`, 'dictionary-admin');
    
    // Get the counts from the query result
    let characterCount = 0;
    let definitionCount = 0;
    
    if (characterQuery.rows && characterQuery.rows.length > 0) {
      characterCount = parseInt(characterQuery.rows[0].count || '0');
    }
    
    if (definitionQuery.rows && definitionQuery.rows.length > 0) {
      definitionCount = parseInt(definitionQuery.rows[0].count || '0');
    }
    
    log(`Final counts: characters=${characterCount}, definitions=${definitionCount}`, 'dictionary-admin');
    
    res.json({ 
      count: characterCount,
      definitionCount: definitionCount 
    });
  } catch (error: any) {
    log(`Error counting characters: ${error}`, 'dictionary-admin');
    res.status(500).json({ error: 'Failed to count characters' });
  }
});

// POST start sample dictionary import (small set for testing)
router.post('/admin/dictionary/import-sample', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting sample import process...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/import-sample-enhanced.js');
    log(`Starting sample import process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the import process (run as ES module)
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers (same as full import)
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting import: ${error}`, 'dictionary-admin');
    importStatus.isRunning = false;
    importStatus.error = error.toString();
    res.status(500).json({ error: error.toString() });
  }
});

// POST start full dictionary import (large dataset)
router.post('/admin/dictionary/import', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting full import process...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/import-all-data.js');
    log(`Starting full import process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the import process (run as ES module)
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting import: ${error}`, 'dictionary-admin');
    importStatus.isRunning = false;
    importStatus.error = error.toString();
    res.status(500).json({ error: error.toString() });
  }
});

// GET import status as Server-Sent Events (SSE)
router.get('/admin/dictionary/import-status', (req, res) => {
  // Set up SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial status
  const initialData = {
    isRunning: importStatus.isRunning,
    progress: importStatus.progress,
    logs: importStatus.logs.slice(-10), // Send only the last 10 logs
    error: importStatus.error,
    stats: importStatus.stats
  };
  
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);
  
  // Generate a unique ID for this client
  const clientId = Date.now().toString();
  
  // Add this client to the list
  clients.push({ id: clientId, res });
  
  // Handle client disconnect
  req.on('close', () => {
    const index = clients.findIndex(client => client.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  });
});

export default router;