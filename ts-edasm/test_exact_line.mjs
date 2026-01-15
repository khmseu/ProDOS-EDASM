#!/usr/bin/env node
import { assemble } from './dist/index.js';

// Exact reproduction from ASM1.S line 1352
const testSource = `
            DB     04,03,02,04,04,04,05,06,05;AND
`;

console.log('Testing exact line from ASM1.S...');

let completed = false;
const timer = setTimeout(() => {
  if (!completed) {
    console.log('⏱️  TIMEOUT - Bug reproduced!');
    process.exit(1);
  }
}, 3000);

try {
  const result = assemble(testSource, { listing: false });
  completed = true;
  clearTimeout(timer);
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  completed = true;
  clearTimeout(timer);
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);
}
