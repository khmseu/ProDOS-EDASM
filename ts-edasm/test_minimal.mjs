#!/usr/bin/env node
import { assemble } from './dist/index.js';

console.log('Testing very simple assembly...');

const simpleTest = `
        ORG $1000
        NOP
`;

console.log('Test 1: NOP instruction');
try {
  const result = assemble(simpleTest, { listing: false });
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
}

const dbTest = `
        ORG $1000
        DB $12
`;

console.log('\nTest 2: DB with hex');
let completed = false;
setTimeout(() => {
  if (!completed) {
    console.log('⏱️  TIMEOUT!');
    process.exit(1);
  }
}, 3000);

try {
  const result = assemble(dbTest, { listing: false });
  completed = true;
  console.log(`✅ Success: ${result.bytes.length} bytes`);
} catch (err) {
  completed = true;
  console.error(`❌ Error: ${err.message}`);
}
