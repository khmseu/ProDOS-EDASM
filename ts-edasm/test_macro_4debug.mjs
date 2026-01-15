#!/usr/bin/env node
// Debug test 4 expansion

import { assemble } from "./dist/index.js";

// Manually show what the expansion should look like
const test4expanded = `
    ORG $4000

MYLOOP  LDA #$FF
    BNE MYLOOP
    RTS
`;

console.log("Testing expected expansion manually:\n");

try {
    const result = assemble(test4expanded);
    if (result.bytes && result.symbols && result.symbols.MYLOOP !== undefined) {
        console.log("  ✅ Manual expansion works");
        console.log("  Symbol MYLOOP =", `$${result.symbols.MYLOOP.toString(16).padStart(4, '0').toUpperCase()}`);
    } else {
        console.log("  ❌ Manual expansion failed");
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
}

// Now test with macro
const test4macro = `
    ORG $4000

LOOP    MACRO
&0      LDA #&1
    BNE &0
    ENDM

    LOOP MYLOOP,$FF
    RTS
`;

console.log("\nTesting with macro:\n");

try {
    const result = assemble(test4macro);
    if (result.bytes && result.symbols) {
        console.log("  Symbols:", Object.keys(result.symbols));
        if (result.symbols.MYLOOP !== undefined) {
            console.log("  ✅ MYLOOP defined =", `$${result.symbols.MYLOOP.toString(16).padStart(4, '0').toUpperCase()}`);
        } else {
            console.log("  ❌ MYLOOP not defined");
        }
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
}
