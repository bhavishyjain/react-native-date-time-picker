const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'expo-demo', 'index.html');

if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Replace any absolute path containing _expo/ in src or href with relative "./_expo/"
  const modifiedContent = content.replace(/(src|href)="[^"]*?\/_expo\//g, '$1="./_expo/');
  
  fs.writeFileSync(indexPath, modifiedContent, 'utf8');
  console.log('Successfully rewrote index.html src paths to be relative.');
} else {
  console.error(`Build output file not found at ${indexPath}`);
  process.exit(1);
}
