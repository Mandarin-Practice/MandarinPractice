// This script is a CommonJS compatible wrapper for our import script
// It allows us to run the import process with Node.js
// console.log('Starting Chinese dictionary import process...');

// Convert from ESM to CommonJS
require('child_process').exec('cd scripts && npx tsx import-all-data.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  // console.log(stdout);
});