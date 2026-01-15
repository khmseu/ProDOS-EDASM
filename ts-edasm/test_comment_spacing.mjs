#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "Comment with space", src: `ORG $1000\nDB $04 ;comment` },
  { name: "Comment no space", src: `ORG $1000\nDB $04;comment` },
  { name: "Multi-value with space", src: `ORG $1000\nDB $04,$05 ;comment` },
  { name: "Multi-value no space", src: `ORG $1000\nDB $04,$05;comment` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT - Found the bug!`);
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
    console.error(`  ❌ Error: ${err.message}`);
  }
  
  if (!completed) break;
}
