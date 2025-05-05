import { Router } from 'express';
import { storage } from '../storage';
import { spawn } from 'child_process';
import { log } from '../vite';
import path from 'path';
import { db } from '../db';

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

// GET character count
router.get('/characters/count', async (req, res) => {
  try {
    // Use SQL query from Drizzle
    const result = await db.execute(
      `SELECT COUNT(DISTINCT c.id) as character_count
       FROM characters c
       JOIN character_definitions cd ON c.id = cd.character_id`
    );
    
    // Get the first row of the result
    const firstRow = (result as any)[0];
    const count = firstRow?.character_count || 0;
    
    res.json({ count });
  } catch (error: any) {
    log(`Error counting characters: ${error}`, 'dictionary-admin');
    res.status(500).json({ error: 'Failed to count characters' });
  }
});

// POST start dictionary import
router.post('/admin/dictionary/import', (req, res) => {
  if (importStatus.isRunning) {
    return res.status(409).json({ error: 'Import already in progress' });
  }
  
  try {
    // Reset status
    importStatus = {
      isRunning: true,
      progress: 0,
      logs: ['Starting import process...'],
      error: null,
      stats: {
        charactersAdded: 0,
        charactersUpdated: 0,
        definitionsAdded: 0,
        errors: 0
      }
    };
    
    const scriptPath = path.resolve(process.cwd(), 'scripts/import-all-data.js');
    log(`Starting import process: ${scriptPath}`, 'dictionary-admin');
    
    // Start the import process
    importProcess = spawn('node', [scriptPath], {
      env: { ...process.env },
      shell: true
    });
    
    // Handle process output
    importProcess.stdout.on('data', (data: Buffer) => {
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
    importProcess.stderr.on('data', (data: Buffer) => {
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
    importProcess.on('close', (code: number) => {
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