#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  {
    name: "DB single value",
    src: "ORG $1000\nDB $04",
    expected: 1
  },
  {
    name: "DB multi-value",
    src: "ORG $1000\nDB $04,$05,$06",
    expected: 3
  },
  {
    name: "DB decimal",
    src: "ORG $1000\nDB 04",
    expected: 1
  },
  {
    name: "DB decimal multi",
    src: "ORG $1000\nDB 04,05,06",
    expected: 3
  },
];

for (const test of tests) {
  try {
    const result = assemble(test.src, { listing: false });
    if (result.bytes.length === test.expected) {
      console.log(`✅ ${test.name}: PASSED`);
    } else {
      console.log(`❌ ${test.name}: FAILED (expected ${test.expected}, got ${result.bytes.length})`);
    }
  } catch (err) {
    console.log(`❌ ${test.name}: ERROR - ${err.message}`);
  }
}

console.log('\\nAll tests completed!');
