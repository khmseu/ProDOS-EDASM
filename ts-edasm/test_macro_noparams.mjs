#!/usr/bin/env node
// Test macro without parameters to isolate the issue

import { assemble } from "./dist/index.js";

console.log("Testing macro without parameters...\n");

const test = `
    ORG $1000

SIMPLE  MACRO
    LDA #42
    ENDM

        SIMPLE
        RTS
`;

console.log("Input source:");
console.log(test);
console.log("\nAttempting to assemble...");

try {
    const result = assemble(test);
    console.log("\n✅ Assembly succeeded!");
    
    if (result.bytes) {
        const code = Array.from(result.bytes);
        console.log("Assembled bytes:", code.map(b => `$${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' '));
        console.log("Expected: $A9 $2A $60 (LDA #42 / RTS)");
    }
    
    if (result.errors) {
        console.log("\nErrors:", result.errors);
    }
} catch (error) {
    console.log("\n❌ Assembly failed:");
    console.log(error.message);
}
