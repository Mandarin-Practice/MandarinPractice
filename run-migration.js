import { exec } from 'child_process';

console.log('Running database migration for advanced lesson vocabulary...');

const command = 'npx drizzle-kit push:pg --config=drizzle.config.ts';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Migration error: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Migration stderr: ${stderr}`);
    return;
  }
  
  console.log(`Migration output: ${stdout}`);
  console.log('Migration completed successfully!');
});