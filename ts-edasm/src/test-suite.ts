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
  {
    name: "STR directive (string with length prefix)",
    source: `
        ORG $6000
        STR "HELLO"
`,
    expected: [0x05, 0x48, 0x45, 0x4c, 0x4c, 0x4f], // 5, 'H', 'E', 'L', 'L', 'O'
  },
  {
    name: "DDB directive (double byte, high-low order)",
    source: `
        ORG $7000
        DDB $1234
`,
    expected: [0x12, 0x34], // High byte first, then low byte
  },
  {
    name: "DCI directive (last char inverted)",
    source: `
        ORG $8000
        DCI "AB"
`,
    expected: [0x41, 0xc2], // 'A', 'B' with high bit set (0x42 | 0x80 = 0xC2)
  },
  {
    name: "Conditional assembly - DO/FIN (true condition)",
    source: `
        ORG $9000
        DO 1
        LDA #$01
        FIN
        RTS
`,
    expected: [0xa9, 0x01, 0x60], // LDA #$01, RTS
  },
  {
    name: "Conditional assembly - DO/FIN (false condition)",
    source: `
        ORG $9000
        DO 0
        LDA #$01
        FIN
        RTS
`,
    expected: [0x60], // Only RTS (LDA skipped)
  },
  {
    name: "Conditional assembly - DO/ELSE/FIN",
    source: `
        ORG $A000
        DO 0
        LDA #$01
        ELSE
        LDA #$02
        FIN
        RTS
`,
    expected: [0xa9, 0x02, 0x60], // LDA #$02, RTS (first LDA skipped)
  },
  {
    name: "Conditional assembly - IFEQ (equal to zero)",
    source: `
        ORG $B000
        IFEQ 0
        LDA #$FF
        FIN
        RTS
`,
    expected: [0xa9, 0xff, 0x60], // LDA #$FF, RTS
  },
  {
    name: "Conditional assembly - IFNE (not equal to zero)",
    source: `
        ORG $C000
        IFNE 5
        LDA #$AA
        FIN
        RTS
`,
    expected: [0xa9, 0xaa, 0x60], // LDA #$AA, RTS
  },
  {
    name: "Conditional assembly - IFGT (greater than zero)",
    source: `
        ORG $D000
        IFGT 10
        LDA #$BB
        FIN
        RTS
`,
    expected: [0xa9, 0xbb, 0x60], // LDA #$BB, RTS
  },
  {
    name: "MSB directive - default OFF (high bit clear)",
    source: `
        ORG $E000
        ASC "A"
`,
    expected: [0x41], // 'A' without high bit (default is OFF)
  },
  {
    name: "MSB directive - ON (high bit set)",
    source: `
        ORG $E100
        MSB 1
        ASC "A"
`,
    expected: [0xc1], // 'A' with high bit set (0x41 | 0x80 = 0xC1)
  },
  {
    name: "MSB directive - toggle OFF/ON",
    source: `
        ORG $E200
        ASC "A"
        MSB 1
        ASC "B"
`,
    expected: [0x41, 0xc2], // 'A' without high bit, 'B' with high bit
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
