import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const fullSource = readFileSync(file, 'utf-8');
const lines = fullSource.split('\n');

console.log('Binary searching for problematic line in SWEET16.S...\n');

function testLines(count) {
  const source = lines.slice(0, count).join('\n');
  
  const timeout = setTimeout(() => {
    console.log(`⏱️  Line ${count}: TIMEOUT (hang detected)`);
    process.exit(1);
  }, 2000);
  
  try {
    const parser = new Parser(source);
    const result = parser.parse();
    clearTimeout(timeout);
    console.log(`✅ Line ${count}: OK (${result.statements.length} statements)`);
    return true;
  } catch (error) {
    clearTimeout(timeout);
    console.log(`❌ Line ${count}: ERROR -`, error.message);
    return false;
  }
}

// Test progressively
const testSizes = [50, 100, 150, 200, 250, 300];
for (const size of testSizes) {
  if (!testLines(size)) {
    console.log('\nStopping at first error');
    break;
  }
}
