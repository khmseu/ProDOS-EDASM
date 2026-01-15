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
  {
    name: "DSECT/DEND - structure definition without bytes",
    source: `
        ORG $F000
        LDA #$01
STRUCT  DSECT
FIELD1  DS 2
FIELD2  DS 4
        DEND
        LDA #$02
`,
    expected: [0xa9, 0x01, 0xa9, 0x02], // Only the LDA instructions, no DS bytes
  },
  {
    name: "DSECT/DEND - labels get correct addresses",
    source: `
        ORG $1000
STRUCT  DSECT
FIELD1  DS 2
FIELD2  DS 4
        DEND
        LDA FIELD1
        LDA FIELD2
`,
    expected: [0xad, 0x00, 0x10, 0xad, 0x02, 0x10], // FIELD1=$1000, FIELD2=$1002
  },
  {
    name: "Macro system - simple macro with parameters",
    source: `
        ORG $1000
STORE   MACRO
        LDA #&1
        STA &2
        ENDM
        STORE $42,$2000
        RTS
`,
    expected: [0xa9, 0x42, 0x8d, 0x00, 0x20, 0x60], // LDA #$42, STA $2000, RTS
  },
  {
    name: "Macro system - parameter count with &X",
    source: `
        ORG $2000
TEST    MACRO
        LDA #&X
        ENDM
        TEST $10,$20,$30
        RTS
`,
    expected: [0xa9, 0x03, 0x60], // LDA #3 (three parameters), RTS
  },
  {
    name: "Macro system - &0 for label generation",
    source: `
        ORG $3000
LOOP    MACRO
&0      LDA #$00
        BNE &0
        ENDM
        LOOP START
        RTS
`,
    expected: [0xa9, 0x00, 0xd0, 0xfc, 0x60], // LDA #$00, BNE -4, RTS
  },
  {
    name: "Relocatable output - REL mode basic",
    source: `
        REL
        ORG $4000
START   LDA #$00
        STA BUFFER
        RTS
BUFFER  DS 1
`,
    expected: [0xa9, 0x00, 0x8d, 0x06, 0x40, 0x60, 0x00], // LDA #0, STA $4006 (BUFFER), RTS, DS 1
  },
  {
    name: "Relocatable output - EXTRN symbols",
    source: `
        REL
        ORG $5000
        EXTRN PRINT
START   JSR PRINT
        RTS
`,
    expected: [0x20, 0x00, 0x00, 0x60], // JSR $0000 (external), RTS
  },
  {
    name: "Relocatable output - ENTRY points",
    source: `
        REL
        ORG $6000
        ENTRY MAIN,HELPER
MAIN    LDA #$01
        RTS
HELPER  LDA #$02
        RTS
`,
    expected: [0xa9, 0x01, 0x60, 0xa9, 0x02, 0x60], // Two routines
  },
  {
    name: "Indexed-indirect (zp,X) addressing",
    source: `
        ORG $8000
ZPTR    EQU $80
        LDA ($80,X)
        STA (ZPTR,X)
`,
    expected: [0xa1, 0x80, 0x81, 0x80], // LDA ($80,X), STA ($80,X)
  },
  {
    name: "Indirect-indexed (zp),Y addressing",
    source: `
        ORG $9000
ZPTR    EQU $90
        LDA ($90),Y
        STA (ZPTR),Y
`,
    expected: [0xb1, 0x90, 0x91, 0x90], // LDA ($90),Y, STA ($90),Y
  },
  {
    name: "Program counter reference (*)",
    source: `
        ORG $A000
HERE    EQU *
        LDA HERE
        STA HERE+1
`,
    expected: [0xad, 0x00, 0xa0, 0x8d, 0x01, 0xa0], // LDA $A000, STA $A001
  },
  {
    name: "Octal constants (@)",
    source: `
        ORG $B000
        LDA #@377
        STA @20
`,
    expected: [0xa9, 0xff, 0x85, 0x10], // LDA #$FF (@377), STA $10 (@20)
  },
  {
    name: "Binary constants (%)",
    source: `
        ORG $C000
        LDA #%11110000
        STA $80
        LDA #%00001111
`,
    expected: [0xa9, 0xf0, 0x85, 0x80, 0xa9, 0x0f], // LDA #$F0 (%11110000), STA $80, LDA #$0F (%00001111)
  },
  {
    name: "Multiple macro calls",
    source: `
        ORG $D000
LOAD    MACRO
        LDA #&1
        ENDM
        LOAD $11
        LOAD $22
        LOAD $33
        RTS
`,
    expected: [0xa9, 0x11, 0xa9, 0x22, 0xa9, 0x33, 0x60], // Three LDA instructions, RTS
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
