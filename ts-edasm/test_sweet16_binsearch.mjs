import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const fullSource = readFileSync(file, 'utf-8');
const lines = fullSource.split('\n');

console.log('Binary search 400-500...\n');

function testLines(count) {
  const source = lines.slice(0, count).join('\n');
  const timeout = setTimeout(() => { return false; }, 2000);
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

// Binary search
let low = 400;
let high = 500;
while (low < high) {
  const mid = Math.floor((low + high) / 2);
  process.stdout.write(`Testing line ${mid}...`);
  if (testLines(mid)) {
    console.log(' OK');
    low = mid + 1;
  } else {
    console.log(' HANG');
    high = mid;
  }
}

console.log(`\nProblematic line: ${low}`);
console.log(lines[low - 1]);
