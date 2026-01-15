#!/usr/bin/env node
// Test just the first two macro tests

import { assemble } from "./dist/index.js";

// Test 1
const test1 = `
    ORG $1000

STORE   MACRO
    LDA #&1
    STA &2
    ENDM

    STORE $42,$2000
    RTS
`;

console.log("Test 1: Simple macro with parameters");
try {
    const result1 = assemble(test1);
    if (result1.bytes) {
        const code = Array.from(result1.bytes);
        console.log("  Bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
        if (code[0] === 0xA9 && code[1] === 0x42 && code[2] === 0x8D && code[3] === 0x00 && code[4] === 0x20 && code[5] === 0x60) {
            console.log("  ✅ PASS\n");
        } else {
            console.log("  ❌ FAIL - Wrong bytes\n");
        }
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
}

// Test 2
const test2 = `
    ORG $2000

ADD16   MACRO
    CLC
    LDA &1
    ADC &3
    STA &1
    LDA &2
    ADC &4
    STA &2
    ENDM

    ADD16 $80,$81,$90,$91
    RTS
`;

console.log("Test 2: Macro with 4 parameters");
try {
    const result2 = assemble(test2);
    if (result2.bytes) {
        console.log("  ✅ PASS\n");
    } else {
        console.log("  ❌ FAIL\n");
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
}

console.log("Tests 1 and 2 complete!");
