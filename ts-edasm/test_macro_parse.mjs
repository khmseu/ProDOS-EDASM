#!/usr/bin/env node
// Test just parsing a macro with parameters

import { Parser } from "./dist/parser.js";

const test = `
STORE   MACRO
    LDA #&1
    ENDM
`;

console.log("Attempting to parse macro definition...\n");

try {
    const parser = new Parser(test);
    const { statements } = parser.parse();
    
    console.log("✅ Parsed successfully!");
    console.log(`Found ${statements.length} statements`);
    
    statements.forEach((stmt, i) => {
        console.log(`[${i}] Label: ${stmt.label || 'none'}, Dir: ${stmt.directive || 'none'}`);
    });
} catch (error) {
    console.log("❌ Parse failed:");
    console.log(error.message);
}
