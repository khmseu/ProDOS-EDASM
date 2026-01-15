#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "Single value", src: `ORG $D000\nDB 04` },
  { name: "Two values", src: `ORG $D000\nDB 04,03` },
  { name: "Three values", src: `ORG $D000\nDB 04,03,02` },
  { name: "Many values", src: `ORG $D000\nDB 04,03,02,04,04,04,05,06,05` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}...`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT`);
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
