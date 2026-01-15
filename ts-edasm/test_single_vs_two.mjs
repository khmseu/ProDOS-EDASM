#!/usr/bin/env node
import { assemble } from './dist/index.js';

console.log('Test single value...');
const single = `
        ORG $1000
        DB $04
`;

try {
  const result1 = assemble(single, { listing: false });
  console.log(`✅ Single: ${result1.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ Single ERROR: ${err.message}`);
}

console.log('\\nTest two values...');
const two = `
        ORG $1000
        DB $04,$05
`;

try {
  const result2 = assemble(two, { listing: false });
  console.log(`✅ Two: ${result2.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ Two ERROR: ${err.message}`);
}

console.log('\\nDone!');
