#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  {
    name: "With ORG",
    src: `        ORG $1000\n        DB     04,03,02,04,04,04,05,06,05;AND`
  },
  {
    name: "Without ORG",
    src: `        DB     04,03,02,04,04,04,05,06,05;AND`
  },
];

for (const test of tests) {
  console.log(`\nTesting: ${test.name}`);
  
  let completed = false;
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT - This is the problem!`);
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
  
  if (!completed) break;
}
