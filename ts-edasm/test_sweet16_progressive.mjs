import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const fullSource = readFileSync(file, 'utf-8');
const lines = fullSource.split('\n');

console.log('Testing progressively larger sections...\n');

function testLines(count) {
  const source = lines.slice(0, count).join('\n');
  
  const timeout = setTimeout(() => {
    return false;
  }, 3000);
  
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

// Test progressively
const testSizes = [300, 400, 500, 600, 693];
for (const size of testSizes) {
  process.stdout.write(`Testing ${size} lines...`);
  if (!testLines(size)) {
    console.log(' HANG');
    break;
  } else {
    console.log(' OK');
  }
}
