#!/usr/bin/env node
import { assemble } from './dist/index.js';

console.log('Simple test without timeout...');

const testSource = `
        ORG $1000
        DB $04
`;

try {
  const result = assemble(testSource, { listing: false });
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);
}

console.log('Done!');
