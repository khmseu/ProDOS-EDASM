import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const fullSource = readFileSync(file, 'utf-8');
const lines = fullSource.split('\n');

console.log('Continuing narrow search from line 212...\n');

function testLines(end) {
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

// Test line by line from 212 onwards
for (let line = 212; line <= 300; line += 10) {
  process.stdout.write(`Testing line ${line}...`);
  if (!testLines(line)) {
    console.log(' HANG');
    console.log(`\nNarrowing down from ${line - 10} to ${line}...`);
    for (let l = line - 10; l <= line; l++) {
      process.stdout.write(`  Line ${l}...`);
      if (!testLines(l)) {
        console.log(' HANG');
        console.log(`\nProblematic line ${l}:`);
        console.log(lines[l - 1]);
        process.exit(0);
      } else {
        console.log(' OK');
      }
    }
    break;
  } else {
    console.log(' OK');
  }
}
