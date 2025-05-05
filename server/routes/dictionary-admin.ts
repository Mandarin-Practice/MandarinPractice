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
  process.on('close', async (code: number) => {
    log(`Import process exited with code ${code}`, 'dictionary-admin');
    
    if (code === 0) {
      importStatus.logs.push('Import completed successfully!');
      
      // Run duplicate definition cleanup automatically after successful import
      try {
        importStatus.logs.push('Running duplicate definition cleanup...');
        sendUpdateToAll({ 
          log: 'Running duplicate definition cleanup...',
          progress: 99,
        });
        
        // Run cleanup script
        const cleanupPath = path.resolve(process.cwd(), 'scripts/cleanup-duplicate-definitions.js');
        const cleanupProcess = spawn('node', ['--experimental-specifier-resolution=node', cleanupPath], {
          env: { ...process.env },
          shell: true,
          stdio: 'pipe'
        });
        
        cleanupProcess.stdout.on('data', (data) => {
          const lines = data.toString().trim().split('\n');
          for (const line of lines) {
            if (line.includes('Removed')) {
              importStatus.logs.push(line);
              sendUpdateToAll({ log: line });
            }
          }
        });
        
        // Wait for cleanup to finish
        await new Promise<void>((resolve) => {
          cleanupProcess.on('close', () => {
            resolve();
          });
        });
        
        importStatus.logs.push('Cleanup completed successfully!');
        sendUpdateToAll({ 
          log: 'Cleanup completed successfully!',
          progress: 100,
          completed: true,
          stats: importStatus.stats
        });
      } catch (error) {
        importStatus.logs.push(`Cleanup error: ${error}`);
        sendUpdateToAll({ 
          log: `Cleanup error: ${error}`,
          progress: 100,
          completed: true,
          stats: importStatus.stats
        });
      }
    } else {
      importStatus.logs.push(`Import failed with exit code ${code}`);
      importStatus.error = `Process exited with code ${code}`;
      sendUpdateToAll({ 
        log: `Import failed with exit code ${code}`,
        error: `Process exited with code ${code}`,
        completed: true
      });
    }
    
    importStatus.isRunning = false;
    importStatus.progress = 100;
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

// POST create character relationships
router.post('/admin/dictionary/create-relationships', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting character relationships creation...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/create-character-relationships.js');
    log(`Starting character relationship process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the process
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting relationship creation: ${error}`, 'dictionary-admin');
    importStatus.isRunning = false;
    importStatus.error = error.toString();
    res.status(500).json({ error: error.toString() });
  }
});

// POST add missing single characters
router.post('/admin/dictionary/add-missing-characters', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting missing character addition...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/add-missing-characters.js');
    log(`Starting missing character addition process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the process
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting missing character addition: ${error}`, 'dictionary-admin');
    importStatus.isRunning = false;
    importStatus.error = error.toString();
    res.status(500).json({ error: error.toString() });
  }
});

// POST add missing definitions
router.post('/admin/dictionary/add-missing-definitions', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting missing definition addition...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/add-missing-definitions.js');
    log(`Starting missing definition addition process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the process
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting missing definition addition: ${error}`, 'dictionary-admin');
    importStatus.isRunning = false;
    importStatus.error = error.toString();
    res.status(500).json({ error: error.toString() });
  }
});

// POST fix variant definitions
router.post('/admin/dictionary/fix-variant-definitions', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting variant definition fixes...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/fix-variant-definitions.js');
    log(`Starting variant definition fix process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the process
    importProcess = spawn('node', ['--experimental-specifier-resolution=node', scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Set up process output handlers
    setupImportProcessHandlers(importProcess, res);
  } catch (error: any) {
    log(`Error starting variant definition fixes: ${error}`, 'dictionary-admin');
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