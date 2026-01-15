#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "DB with hex", src: `ORG $D000\nDB $04` },
  { name: "DB with decimal", src: `ORG $D000\nDB 04` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}...`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT - This is the problem!`);
      process.exit(1);
    }
  }, 2000);
  
  try {
    const result = assemble(test.src, { listing: false });
    completed = true;
    clearTimeout(timer);
    console.log(`  ✅ Success: ${result.bytes.length} bytes`);
  } catch (err) {
    completed = true;
    clearTimeout(timer);
    console.error(`  ❌ Error: ${err.message}`);
  }
}

console.log('\nAll tests completed!');
