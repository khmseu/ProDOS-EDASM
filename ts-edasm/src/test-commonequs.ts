import { assemble } from './index.js';
import { readFileSync } from 'fs';

const source = readFileSync('/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/COMMONEQUS.S', 'utf-8');

console.log('Testing COMMONEQUS.S assembly...');
console.log('Source length:', source.length, 'characters');
console.log('First 500 chars:', source.substring(0, 500));
console.log('\nAttempting assembly...');

try {
  const result = assemble(source, { listing: false });
  console.log('✅ Assembly succeeded!');
  console.log('Symbols defined:', Object.keys(result.symbols).length);
  console.log('Bytes generated:', result.bytes.length);
  console.log('First 20 symbols:', Object.keys(result.symbols).slice(0, 20));
} catch (error) {
  console.log('❌ Assembly failed:');
  console.log(error);
}
