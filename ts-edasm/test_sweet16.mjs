import { assemble } from './dist/index.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const source = readFileSync(file, 'utf-8');

console.log('Testing SWEET16.S assembly...');
console.log('Source length:', source.length, 'characters');
console.log('Source lines:', source.split('\n').length);
console.log('');

try {
  const result = assemble(source, { listing: false });
  console.log('✅ Assembly succeeded!');
  console.log('   Symbols defined:', Object.keys(result.symbols).length);
  console.log('   Bytes generated:', result.bytes.length);
  console.log('   Origin:', result.origin ? `$${result.origin.toString(16).toUpperCase()}` : 'not set');
  console.log('');
  console.log('   First 32 bytes (hex):');
  const hexBytes = Array.from(result.bytes.slice(0, 32))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  console.log('  ', hexBytes);
} catch (error) {
  console.log('❌ Assembly failed:');
  console.log('   Error:', error.message || error);
  if (error.line) console.log('   At line:', error.line);
  if (error.column) console.log('   At column:', error.column);
}
