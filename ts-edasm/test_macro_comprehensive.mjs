#!/usr/bin/env node
// Comprehensive macro test

import { assemble } from "./dist/index.js";

let passed = 0;
let failed = 0;

function test(name, source, check) {
    console.log(`\nTest: ${name}`);
    try {
        const result = assemble(source);
        if (check(result)) {
            console.log("  ✅ PASS");
            passed++;
        } else {
            console.log("  ❌ FAIL");
            failed++;
        }
    } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
        failed++;
    }
}

console.log("=== Macro System Test Suite ===\n");

// Test 1: Simple macro without parameters
test("Simple macro without parameters", `
    ORG $1000
SIMPLE  MACRO
    NOP
    ENDM
    
    SIMPLE
    RTS
`, (r) => r.bytes && r.bytes.length === 2); // NOP + RTS

// Test 2: Macro with one parameter
test("Macro with one parameter", `
    ORG $1000
LOAD    MACRO
    LDA #&1
    ENDM
    
    LOAD $42
    RTS
`, (r) => r.bytes && r.bytes[0] === 0xA9 && r.bytes[1] === 0x42);

// Test 3: Macro with multiple parameters
test("Macro with multiple parameters", `
    ORG $1000
STORE   MACRO
    LDA #&1
    STA &2
    ENDM
    
    STORE $42,$2000
    RTS
`, (r) => r.bytes && r.bytes.length === 6);

// Test 4: Macro with label parameter (&0)
test("Macro with label parameter (&0)", `
    ORG $1000
LOOP    MACRO
&0      LDA #&1
    BNE &0
    ENDM
    
    LOOP MYLOOP,$FF
    RTS
`, (r) => r.symbols && r.symbols.MYLOOP === 0x1000);

// Test 5: Macro called multiple times
test("Macro called multiple times", `
    ORG $1000
INC16   MACRO
    INC &1
    BNE SKIP
    INC &2
SKIP    NOP
    ENDM
    
    INC16 $80,$81
    INC16 $90,$91
    RTS
`, (r) => r.bytes && r.bytes.length > 10);

// Test 6: Nested macro expansion
test("Nested macros", `
    ORG $1000
INCA    MACRO
    INC $00
    ENDM

DOUBLE  MACRO
    INCA
    INCA
    ENDM
    
    DOUBLE
    RTS
`, (r) => r.bytes && r.bytes.length === 7); // 2xINC + RTS

// Test 7: Macro with &X parameter count
test("Macro with &X parameter count", `
    ORG $1000
COUNT   MACRO
    LDA #&X
    ENDM
    
    COUNT $11,$22,$33
    RTS
`, (r) => r.bytes && r.bytes[1] === 3); // Should load #3

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"=".repeat(40)}\n`);

if (failed === 0) {
    console.log("🎉 All macro tests passed!");
} else {
    console.log(`❌ ${failed} test(s) failed`);
}
