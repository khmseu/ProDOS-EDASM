#!/usr/bin/env node
import { assemble } from './dist/index.js';

console.log('Test with template literal...');
const template = `
        ORG $1000
        DB $04,$05
`;

try {
  const result1 = assemble(template, { listing: false });
  console.log(`✅ Template: ${result1.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ Template ERROR: ${err.message}`);
}

console.log('\\nTest with string literal...');
const string = "ORG $1000\nDB $04,$05";

try {
  const result2 = assemble(string, { listing: false });
  console.log(`✅ String: ${result2.bytes.length} bytes`);
} catch (err) {
  console.log(`❌ String ERROR: ${err.message}`);
}

console.log('\\nDone!');
