import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const fullSource = readFileSync(file, 'utf-8');
const lines = fullSource.split('\n');

console.log('Narrow search for problematic line...\n');

function testLines(start, end) {
  const source = lines.slice(0, end).join('\n');
  
  const timeout = setTimeout(() => {
    return false; // Timeout
  }, 1500);
  
  try {
    const parser = new Parser(source);
    const result = parser.parse();
    clearTimeout(timeout);
    return true;
  } catch (error) {
    clearTimeout(timeout);
    return false;
  }
}

// Test line by line from 200 to 250
for (let line = 200; line <= 250; line++) {
  process.stdout.write(`Testing line ${line}...`);
  if (!testLines(0, line)) {
    console.log(' HANG');
    console.log(`\nProblematic line ${line}:`);
    console.log(lines[line - 1]);
    break;
  } else {
    console.log(' OK');
  }
}
