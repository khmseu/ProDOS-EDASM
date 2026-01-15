#!/usr/bin/env node
import { assemble } from "./dist/index.js";

console.log("Testing octal constant support...\n");

// Test 1: Basic octal constant
const test1 = `
    ORG $1000
    LDA #@377    ; Octal 377 = 255 decimal = $FF hex
    RTS
`;

console.log("Test 1: Basic octal constant @377 (should be 255/$FF)");
const result1 = assemble(test1);
if (result1.bytes) {
  const code = Array.from(result1.bytes);
  console.log("  Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
  console.log("  Expected: $A9 $FF $60");
  if (code[0] === 0xA9 && code[1] === 0xFF && code[2] === 0x60) {
    console.log("  ✅ PASS\n");
  } else {
    console.log("  ❌ FAIL\n");
  }
} else {
  console.log("  ❌ FAIL - No bytes generated");
}

// Test 2: Multiple octal values
const test2 = `
    ORG $2000
    DB @0      ; Octal 0 = 0
    DB @10     ; Octal 10 = 8 decimal
    DB @100    ; Octal 100 = 64 decimal
    DB @377    ; Octal 377 = 255 decimal
`;

console.log("Test 2: Multiple octal values");
const result2 = assemble(test2);
if (result2.bytes) {
  const code = Array.from(result2.bytes);
  console.log("  Assembled bytes:", code.map(b => b.toString(10)).join(', '));
  console.log("  Expected: 0, 8, 64, 255");
  if (code[0] === 0 && code[1] === 8 && code[2] === 64 && code[3] === 255) {
    console.log("  ✅ PASS\n");
  } else {
    console.log("  ❌ FAIL\n");
  }
} else {
  console.log("  ❌ FAIL - No bytes generated\n");
}

// Test 3: Octal in expressions
const test3 = `
    ORG $3000
VALUE   EQU @100     ; Octal 100 = 64
    LDA #VALUE
    RTS
`;

console.log("Test 3: Octal constant in EQU");
const result3 = assemble(test3);
if (result3.bytes) {
  const code = Array.from(result3.bytes);
  console.log("  Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
  console.log("  Expected: $A9 $40 $60 (64 decimal = $40 hex)");
  if (code[0] === 0xA9 && code[1] === 0x40 && code[2] === 0x60) {
    console.log("  ✅ PASS\n");
  } else {
    console.log("  ❌ FAIL\n");
  }
} else {
  console.log("  ❌ FAIL - No bytes generated\n");
}

// Test 4: Octal 777 (max valid 3-digit octal)
const test4 = `
    ORG $4000
    DW @777     ; Octal 777 = 511 decimal = $01FF
`;

console.log("Test 4: Octal @777 (511 decimal)");
const result4 = assemble(test4);
if (result4.bytes) {
  const code = Array.from(result4.bytes);
  console.log("  Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
  console.log("  Expected: $FF $01 (little-endian word)");
  if (code[0] === 0xFF && code[1] === 0x01) {
    console.log("  ✅ PASS\n");
  } else {
    console.log("  ❌ FAIL\n");
  }
} else {
  console.log("  ❌ FAIL - No bytes generated\n");
}

console.log("Octal constant testing complete!");
