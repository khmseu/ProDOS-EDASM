#!/usr/bin/env node
import { assemble } from './dist/index.js';

// Test with and without ORG
const withOrg = `
            ORG    $D000
            DB     04,03,02,04,04,04,05,06,05;AND
`;

const withoutOrg = `
            DB     04,03,02,04,04,04,05,06,05;AND
`;

console.log('Test 1: With ORG...');
let completed1 = false;
setTimeout(() => {
  if (!completed1) {
    console.log('⏱️  WITH ORG TIMEOUT');
    process.exit(1);
  }
}, 2000);

try {
  const result = assemble(withOrg, { listing: false });
  completed1 = true;
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  completed1 = true;
  console.error(`❌ Error: ${err.message}`);
}

console.log('\nTest 2: Without ORG...');
let completed2 = false;
setTimeout(() => {
  if (!completed2) {
    console.log('⏱️  WITHOUT ORG TIMEOUT');
    console.log('\n=== BUG FOUND ===');
    console.log('Multi-value DB without preceding ORG causes infinite loop');
    process.exit(1);
  }
}, 2000);

try {
  const result = assemble(withoutOrg, { listing: false });
  completed2 = true;
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  completed2 = true;
  console.error(`❌ Error: ${err.message}`);
}
