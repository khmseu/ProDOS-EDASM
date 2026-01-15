#!/usr/bin/env node
import { assemble } from './dist/index.js';

console.log('Test 1: DB single value');
try {
  const result1 = assemble("ORG $1000\nDB $04", { listing: false });
  console.log(`✅ PASSED: ${result1.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ ERROR: ${err.message}`);
}

console.log('\\nTest 2: DB multi-value');
try {
  const result2 = assemble("ORG $1000\nDB $04,$05,$06", { listing: false });
  console.log(`✅ PASSED: ${result2.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ ERROR: ${err.message}`);
}

console.log('\\nAll done!');
