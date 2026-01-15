#!/usr/bin/env node
// Simple macro test for debugging

import { assemble } from "./dist/index.js";

console.log("Testing simple macro...\n");

const test = `
    ORG $1000

STORE   MACRO
    LDA #&1
    STA &2
    ENDM

    STORE $42,$2000
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
        console.log("Expected: $A9 $42 $8D $00 $20 $60");
        
        if (code.length === 6 && 
            code[0] === 0xA9 && code[1] === 0x42 && 
            code[2] === 0x8D && code[3] === 0x00 && 
            code[4] === 0x20 && code[5] === 0x60) {
            console.log("\n✅✅✅ MACRO TEST PASSED!");
        } else {
            console.log("\n❌ Bytes don't match expected");
        }
    }
    
    if (result.errors && result.errors.length > 0) {
        console.log("\nErrors:");
        result.errors.forEach(err => console.log("  -", err));
    }
    
    if (result.symbols) {
        console.log("\nSymbols:");
        Object.entries(result.symbols).forEach(([name, value]) => {
            console.log(`  ${name} = $${value.toString(16).padStart(4, '0').toUpperCase()}`);
        });
    }
} catch (error) {
    console.log("\n❌ Assembly failed with error:");
    console.log(error.message);
    console.log(error.stack);
}
