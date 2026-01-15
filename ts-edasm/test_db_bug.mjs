#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "No comment", src: `        ORG $1000\n        DB $04` },
  { name: "With comment", src: `        ORG $1000\n        DB $04 ;test` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT`);
      completed = true;
    }
  }, 2000);
  
  try {
    const result = assemble(test.src, { listing: false });
    completed = true;
    clearTimeout(timer);
    console.log(`  ✅ Success: ${result.bytes.length} bytes, value: ${Array.from(result.bytes).map(b => '$' + b.toString(16).padStart(2, '0')).join(',')}`);
  } catch (err) {
    completed = true;
    clearTimeout(timer);
    console.error(`  ❌ Error: ${err.message}`);
  }
  
  if (!completed) {
    console.log('\nBUG FOUND: DB directive with comment causes infinite loop');
    break;
  }
}
