import { assemble } from './dist/index.js';
import { readFileSync } from 'fs';

const file = '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/SWEET16.S';
const source = readFileSync(file, 'utf-8');

console.log('Testing SWEET16.S assembly with error catching...');
console.log('Source length:', source.length, 'characters');
console.log('Source lines:', source.split('\n').length);
console.log('');

// Set a timer to detect hang
let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  console.log('⏱️  TIMEOUT: Assembly taking too long (likely infinite loop)');
  process.exit(1);
}, 5000);

try {
  const result = assemble(source, { listing: false });
  clearTimeout(timeout);
  
  if (!timedOut) {
    console.log('✅ Assembly succeeded!');
    console.log('   Symbols defined:', Object.keys(result.symbols).length);
    console.log('   Bytes generated:', result.bytes.length);
    console.log('   Errors:', result.errors ? result.errors.length : 0);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n   Errors encountered:');
      result.errors.slice(0, 10).forEach(err => console.log('     -', err));
      if (result.errors.length > 10) {
        console.log('     ... and', result.errors.length - 10, 'more');
      }
    }
  }
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ Assembly failed with exception:');
  console.log('   Error:', error.message || error);
  if (error.stack) {
    console.log('\n   Stack trace:');
    console.log(error.stack);
  }
}
