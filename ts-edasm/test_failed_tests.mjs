#!/usr/bin/env node
import { assemble } from './dist/index.js';

const tests = [
  {
    name: "Data directives",
    source: `
        ORG $4000
        DB $12
        DW $3456
        ASC "HI"
`,
    expected: [0x12, 0x56, 0x34, 0x48, 0x49],
  },
  {
    name: "DDB directive",
    source: `
        ORG $7000
        DDB $1234
`,
    expected: [0x12, 0x34],
  },
];

for (const test of tests) {
  try {
    const result = assemble(test.source, { listing: false });
    const got = Array.from(result.bytes);
    const match = JSON.stringify(got) === JSON.stringify(test.expected);
    
    if (match) {
      console.log(`✅ ${test.name}: PASSED`);
    } else {
      console.log(`❌ ${test.name}: FAILED`);
      console.log(`   Expected: [${test.expected.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
      console.log(`   Got:      [${got.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', ')}]`);
    }
  } catch (err) {
    console.log(`❌ ${test.name}: ERROR - ${err.message}`);
  }
}
