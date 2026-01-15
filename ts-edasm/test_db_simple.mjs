#!/usr/bin/env node
import { assemble } from './dist/index.js';

// Test just a few lines
const testSource = `
            ORG    $D000
            DB     04,03,02,04,04,04,05,06,05;CMP
`;

console.log('Testing single multi-value DB...');

try {
  const result = assemble(testSource, { listing: false });
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);
}
