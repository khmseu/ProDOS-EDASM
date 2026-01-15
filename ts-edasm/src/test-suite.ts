#!/usr/bin/env node
import { assemble } from "./index.js";

// Comprehensive test suite for the EDASM assembler
const tests = [
  {
    name: "Simple program with branches",
    source: `
        ORG $1000
START   LDA #$00
        STA $2000
        INX
        BNE START
        RTS
`,
    expected: [0xa9, 0x00, 0x8d, 0x00, 0x20, 0xe8, 0xd0, 0xf8, 0x60],
  },
  {
    name: "Zero page addressing",
    source: `
        ORG $2000
        LDA $80
        STA $90
`,
    expected: [0xa5, 0x80, 0x85, 0x90],
  },
  {
    name: "Immediate and absolute indexed",
    source: `
        ORG $3000
        LDX #$10
        LDA $1000,X
        STA $2000,Y
`,
    expected: [0xa2, 0x10, 0xbd, 0x00, 0x10, 0x99, 0x00, 0x20],
  },
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
    name: "EQU and symbols",
    source: `
VALUE   EQU $FF
        ORG $5000
        LDA #VALUE
`,
    expected: [0xa9, 0xff],
  },
];

console.log("Running EDASM assembler test suite...\n");

let passed = 0;
let failed = 0;

for (const test of tests) {
  process.stdout.write(`Testing: ${test.name}... `);

  try {
    const result = assemble(test.source);

    if (result.bytes.length !== test.expected.length) {
      console.log(`❌ FAILED`);
      console.log(
        `  Length mismatch: expected ${test.expected.length}, got ${result.bytes.length}`,
      );
      console.log(
        `  Expected: ${test.expected.map((b) => b.toString(16).padStart(2, "0")).join(" ")}`,
      );
      console.log(
        `  Got:      ${Array.from(result.bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")}`,
      );
      failed++;
      continue;
    }

    let testPassed = true;
    for (let i = 0; i < test.expected.length; i++) {
      if (result.bytes[i] !== test.expected[i]) {
        console.log(`❌ FAILED`);
        console.log(
          `  Byte ${i} mismatch: expected $${test.expected[i].toString(16).padStart(2, "0")}, got $${result.bytes[i].toString(16).padStart(2, "0")}`,
        );
        console.log(
          `  Expected: ${test.expected.map((b) => b.toString(16).padStart(2, "0")).join(" ")}`,
        );
        console.log(
          `  Got:      ${Array.from(result.bytes)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")}`,
        );
        testPassed = false;
        break;
      }
    }

    if (testPassed) {
      console.log(`✅ PASSED`);
      passed++;
    } else {
      failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED with error`);
    console.log(`  ${error}`);
    failed++;
  }
}

console.log(
  `\nResults: ${passed} passed, ${failed} failed out of ${tests.length} tests`,
);

if (failed > 0) {
  process.exit(1);
}
