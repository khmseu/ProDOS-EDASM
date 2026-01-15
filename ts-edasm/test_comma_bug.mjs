#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "Single value", src: `ORG $1000\nDB 04` },
  { name: "Two values (comma)", src: `ORG $1000\nDB 04,03` },
  { name: "Two values with comment", src: `ORG $1000\nDB 04,03;test` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT!`);
      completed = true;
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
    console.error(`  ❌ Error: ${err.message.substring(0, 100)}`);
  }
  
  if (!completed) {
    console.log('\n=== BUG IDENTIFIED ===');
    console.log('DB directive with comma-separated values causes infinite loop');
    break;
  }
}
