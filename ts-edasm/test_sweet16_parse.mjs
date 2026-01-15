import { Parser } from './dist/parser.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const source = readFileSync(file, 'utf-8');

console.log('Testing SWEET16.S parsing only...');
console.log('Source length:', source.length, 'characters');
console.log('Source lines:', source.split('\n').length);
console.log('');

// Set a timer to detect hang
const timeout = setTimeout(() => {
  console.log('⏱️  TIMEOUT: Parsing taking too long (likely infinite loop in parser)');
  process.exit(1);
}, 3000);

try {
  const parser = new Parser(source);
  console.log('Parser created, starting parse...');
  
  const result = parser.parse();
  clearTimeout(timeout);
  
  console.log('✅ Parsing succeeded!');
  console.log('   Statements parsed:', result.statements.length);
  console.log('   Tokens:', result.tokens.length);
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Parsing failed:');
  console.log('   Error:', error.message || error);
  if (error.stack) {
    console.log('\n   Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
  }
}
