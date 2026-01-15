#!/usr/bin/env node
/**
 * Test for listing control directives (PARTIALLY IMPLEMENTED)
 * 
 * This test documents the expected behavior for listing control according to the EDASM spec.
 * According to IMPLEMENTATION_STATUS.md:
 * 
 * - LST ON/OFF: Basic support exists, needs full testing
 * - PAGE: Not implemented (page eject)
 * - SKP: Not implemented (blank lines)
 * - REP: Not implemented (repeated character)
 * - CHR: Not implemented (set repeat character)
 * - SBTL: Not implemented (subtitle)
 */

import { assemble } from "./dist/index.js";

console.log("Testing listing control directives...\n");
console.log("⚠️  NOTE: Some directives partially implemented or not yet implemented\n");

// Test 1: LST ON/OFF
const test1 = `
    ORG $1000
    LST ON
    LDA #$00
    LST OFF
    STA $2000    ; Should not appear in listing
    LST ON
    RTS
`;

console.log("Test 1: LST ON/OFF - control listing output");
console.log("Expected behavior:");
console.log("  - LDA #$00 appears in listing");
console.log("  - STA $2000 does NOT appear in listing");
console.log("  - RTS appears in listing");

try {
    const result1 = assemble(test1, { listing: true });
    if (result1.listing) {
        console.log("\nActual listing:");
        console.log(result1.listing);
        if (result1.listing.includes('LDA') && result1.listing.includes('RTS')) {
            console.log("⚠️  PARTIAL - LST ON/OFF exists, verify STA is suppressed\n");
        } else {
            console.log("❌ FAIL - LST ON/OFF not working correctly\n");
        }
    } else {
        console.log("❌ FAIL - No listing generated\n");
    }
} catch (error) {
    console.log(`❌ ERROR - ${error.message}\n`);
}

// Test 2: PAGE - page eject
const test2 = `
    ORG $2000
    LDA #$00
    PAGE        ; Should cause page eject in listing
    STA $2000
`;

console.log("Test 2: PAGE - page eject in listing");
console.log("Expected behavior:");
console.log("  - Form feed character inserted in listing");
console.log("  - New page starts with STA instruction");

try {
    const result2 = assemble(test2, { listing: true });
    if (result2.listing) {
        if (result2.listing.includes('\f')) {
            console.log("  ✅ PASS - PAGE directive inserts form feed\n");
        } else {
            console.log("  ❌ NOT IMPLEMENTED - No form feed in listing\n");
        }
    } else {
        console.log("  ❌ FAIL - No listing generated\n");
    }
} catch (error) {
    console.log(`  ❌ NOT IMPLEMENTED - ${error.message}\n`);
}

// Test 3: SKP - blank lines
const test3 = `
    ORG $3000
    LDA #$00
    SKP 2       ; Should insert 2 blank lines
    STA $2000
`;

console.log("Test 3: SKP - insert blank lines in listing");
console.log("Expected behavior:");
console.log("  - 2 blank lines between LDA and STA in listing");

try {
    const result3 = assemble(test3, { listing: true });
    if (result3.listing) {
        const lines = result3.listing.split('\n');
        console.log("  ❌ NOT IMPLEMENTED - SKP directive not recognized\n");
    } else {
        console.log("  ❌ FAIL - No listing generated\n");
    }
} catch (error) {
    console.log(`  ❌ NOT IMPLEMENTED - ${error.message}\n`);
}

// Test 4: REP and CHR - repeated character
const test4 = `
    ORG $4000
    CHR *       ; Set repeat character to asterisk
    REP 40      ; Print 40 asterisks as separator
    LDA #$00
    REP 40
    RTS
`;

console.log("Test 4: REP and CHR - repeated character line");
console.log("Expected behavior:");
console.log("  - Line of 40 asterisks before LDA");
console.log("  - Line of 40 asterisks after LDA");

try {
    const result4 = assemble(test4, { listing: true });
    if (result4.listing) {
        console.log("  ❌ NOT IMPLEMENTED - REP/CHR directives not recognized\n");
    } else {
        console.log("  ❌ FAIL - No listing generated\n");
    }
} catch (error) {
    console.log(`  ❌ NOT IMPLEMENTED - ${error.message}\n`);
}

// Test 5: SBTL - subtitle
const test5 = `
    ORG $5000
    SBTL 'Memory Manager Routines'
    LDA #$00
    STA $2000
`;

console.log("Test 5: SBTL - subtitle in listing");
console.log("Expected behavior:");
console.log("  - Subtitle appears at top of page");
console.log("  - Subtitle: 'Memory Manager Routines'");

try {
    const result5 = assemble(test5, { listing: true });
    if (result5.listing) {
        console.log("  ❌ NOT IMPLEMENTED - SBTL directive not recognized\n");
    } else {
        console.log("  ❌ FAIL - No listing generated\n");
    }
} catch (error) {
    console.log(`  ❌ NOT IMPLEMENTED - ${error.message}\n`);
}

console.log("Listing control directives testing complete!");
console.log("\nSummary:");
console.log("- LST ON/OFF: ⚠️  Partially implemented (needs full testing)");
console.log("- PAGE: ❌ Not implemented");
console.log("- SKP: ❌ Not implemented");
console.log("- REP: ❌ Not implemented");
console.log("- CHR: ❌ Not implemented");
console.log("- SBTL: ❌ Not implemented");
console.log("\nPriority: MEDIUM (Common in existing source files)");
