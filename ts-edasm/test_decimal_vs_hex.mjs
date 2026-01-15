#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  { name: "Single hex", src: `ORG $1000\nDB $04` },
  { name: "Single decimal", src: `ORG $1000\nDB 04` },
  { name: "Two hex", src: `ORG $1000\nDB $04,$05` },
  { name: "Two decimal", src: `ORG $1000\nDB 04,05` },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT - Bug found here!`);
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
