#!/usr/bin/env node
// Simplified test 3 to debug &X

import { assemble } from "./dist/index.js";

const test3 = `
    ORG $3000

SIMPLE  MACRO
    DO &X
    PHA
    FIN
    ENDM

    SIMPLE
    RTS
`;

console.log("Test 3 simplified: Macro using &X");
console.log("Expected: SIMPLE with no args should skip PHA (since &X=0)\n");

try {
    const result3 = assemble(test3);
    if (result3.bytes) {
        const code = Array.from(result3.bytes);
        console.log("  Bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
        console.log("  Expected: $60 (just RTS)");
        if (code.length === 1 && code[0] === 0x60) {
            console.log("  ✅ PASS\n");
        } else {
            console.log("  ❌ FAIL - Wrong bytes\n");
        }
    } else {
        console.log("  ❌ FAIL - No bytes\n");
    }
} catch (error) {
    console.log(`  ❌ ERROR: ${error.message}\n`);
    console.log(error.stack);
}
