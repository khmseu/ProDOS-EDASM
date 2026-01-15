#!/usr/bin/env node
import { assemble } from "./dist/index.js";

const test = `
    ORG $1000
    LDA #$00
    PAGE
    STA $2000
    SKP 2
    RTS
    REP 10
    CHR '='
    REP 10
`;

console.log("Testing listing directives...");
const result = assemble(test, { listing: true });
if (result.listing) {
    console.log("\n" + result.listing);
    console.log("\n✅ Listing generated successfully!");
    if (result.listing.includes('\f')) {
        console.log("✅ PAGE directive works (form feed found)");
    }
} else {
    console.log("❌ No listing generated");
}
