#!/usr/bin/env node
import { assemble } from "./dist/index.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

console.log("Testing INCLUDE directive support...\n");

// Create a temporary test directory
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edasm-test-'));

try {
  // Create test files
  fs.writeFileSync(path.join(testDir, "constants.s"), `; Shared constants file
SCREEN  EQU $400
BELL    EQU $7
CR      EQU $0D
`);

  fs.writeFileSync(path.join(testDir, "main.s"), `; Main program
    ORG $1000
    INCLUDE "constants.s"
START   LDA #BELL
        STA SCREEN
        LDA #CR
        RTS
`);

  // Test 1: Basic INCLUDE
  const mainSource = fs.readFileSync(path.join(testDir, "main.s"), "utf-8");

  console.log("Test 1: Basic INCLUDE directive");
  console.log("Main file includes constants.s which defines SCREEN, BELL, and CR");
  const result1 = assemble(mainSource, { basePath: testDir });

  if (result1.bytes) {
    const code = Array.from(result1.bytes);
    console.log("  Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
    console.log("  Symbols:", result1.symbols);
    
    // Check that symbols from include were defined
    if (result1.symbols.SCREEN === 0x400 && result1.symbols.BELL === 7 && result1.symbols.CR === 0x0D) {
      console.log("  ✅ PASS - Symbols from INCLUDE file correctly defined\n");
    } else {
      console.log("  ❌ FAIL - Symbols not correctly defined\n");
    }
    
    // Check that the code uses the constants
    // LDA #BELL should be A9 07, STA SCREEN should be 8D 00 04, LDA #CR should be A9 0D
    if (code[0] === 0xA9 && code[1] === 0x07 && 
        code[2] === 0x8D && code[3] === 0x00 && code[4] === 0x04 &&
        code[5] === 0xA9 && code[6] === 0x0D) {
      console.log("  ✅ PASS - Code correctly uses included constants\n");
    } else {
      console.log("  ❌ FAIL - Code doesn't use constants correctly\n");
      console.log("  Expected: A9 07 8D 00 04 A9 0D 60");
    }
  } else {
    console.log("  ❌ FAIL - No bytes generated\n");
  }

  // Test 2: Missing file handling
  console.log("Test 2: Missing INCLUDE file");
  const missingInclude = `
      ORG $2000
      INCLUDE "nonexistent.s"
      LDA #$FF
      RTS
  `;

  const result2 = assemble(missingInclude, { basePath: testDir });
  if (result2.bytes) {
    const code = Array.from(result2.bytes);
    console.log("  Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
    // Should still assemble the rest of the code
    if (code[0] === 0xA9 && code[1] === 0xFF && code[2] === 0x60) {
      console.log("  ✅ PASS - Assembly continues after missing INCLUDE\n");
      if (result2.errors && result2.errors.length > 0) {
        console.log("  Error recorded:", result2.errors[0]);
      }
    } else {
      console.log("  ❌ FAIL - Code not assembled correctly\n");
    }
  } else {
    console.log("  ❌ FAIL - No bytes generated\n");
  }

  // Test 3: Nested includes
  console.log("Test 3: Nested INCLUDE");
  fs.writeFileSync(path.join(testDir, "level1.s"), `VAL1    EQU $10
      INCLUDE "level2.s"
VAL3    EQU $30
`);

  fs.writeFileSync(path.join(testDir, "level2.s"), `VAL2    EQU $20
`);

  const nestedSource = `    ORG $3000
      INCLUDE "level1.s"
      LDA #$FF
`;

  const result3 = assemble(nestedSource, { basePath: testDir });
  if (result3.bytes) {
    const code = Array.from(result3.bytes);
    console.log("  Assembled bytes:", code.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
    console.log("  Symbols:", result3.symbols);
    
    // Check symbols were defined from nested includes
    if (result3.symbols.VAL1 === 0x10 && result3.symbols.VAL2 === 0x20 && result3.symbols.VAL3 === 0x30) {
      console.log("  ✅ PASS - Nested includes work correctly\n");
    } else {
      console.log("  ❌ FAIL - Nested includes didn't work\n");
    }
  } else {
    console.log("  ❌ FAIL - No bytes generated\n");
  }

  console.log("INCLUDE directive testing complete!");

} finally {
  // Clean up temporary directory
  fs.rmSync(testDir, { recursive: true, force: true });
}
