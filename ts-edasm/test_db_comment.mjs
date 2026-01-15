#!/usr/bin/env node
import { assemble } from './dist/index.js';

// Test without comment
const test1 = `
            ORG    $D000
            DB     04,03,02,04,04,04,05,06,05
`;

const test2 = `
            ORG    $D000
            DB     04,03,02,04,04,04,05,06,05;CMP
`;

console.log('Testing DB without comment...');
try {
  const result = assemble(test1, { listing: false });
  console.log(`✅ Success (no comment): ${result.bytes.length} bytes`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
}

console.log('\nTesting DB with comment...');
try {
  const startTime = Date.now();
  const timer = setTimeout(() => {
    console.log('⏱️  TIMEOUT - hangs with comment');
    process.exit(1);
  }, 2000);
  
  const result = assemble(test2, { listing: false });
  clearTimeout(timer);
  console.log(`✅ Success (with comment): ${result.bytes.length} bytes`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
}
