#!/usr/bin/env node
// Test 4: Macro label generation (&0)

import { assemble } from "./dist/index.js";

const test4 = `
    ORG $4000

LOOP    MACRO
&0      LDA #&1
    BNE &0
    ENDM

    LOOP MYLOOP,$FF
    RTS
`;

console.log("Test 4: Macro with label parameter (&0)");
console.log("Expected: &0 parameter should create labels in expansion\n");

try {
    const result4 = assemble(test4);
    if (result4.bytes && result4.symbols && result4.symbols.MYLOOP !== undefined) {
        console.log("  Bytes:", Array.from(result4.bytes).map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
        console.log("  Symbol MYLOOP =", `$${result4.symbols.MYLOOP.toString(16).padStart(4, '0').toUpperCase()}`);
        console.log("  ✅ PASS\n");
    } else {
        console.log("  ❌ FAIL - Label not generated\n");
        if (result4.symbols) {
            console.log("  Symbols:", Object.keys(result4.symbols));
        }
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
}
