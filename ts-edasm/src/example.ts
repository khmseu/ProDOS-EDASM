#!/usr/bin/env node
import { assemble } from "./index.js";

// Example: A simple 6502 program that clears screen memory
const program = `
; Clear screen routine for Apple II
; Clears text screen at $0400-$07FF

SCREEN  EQU $0400       ; Text screen start
SCRLEN  EQU $0400       ; Screen size (1024 bytes)

        ORG $0300       ; Load at $0300

CLEAR   LDX #$00        ; Initialize index
        LDA #$A0        ; Space character (inverse)
LOOP    STA SCREEN,X    ; Store to screen
        STA SCREEN+$100,X
        STA SCREEN+$200,X
        STA SCREEN+$300,X
        INX             ; Increment index
        BNE LOOP        ; Loop if not done
        RTS             ; Return
`;

console.log("Example: Assembling Apple II screen clear routine\n");
console.log(program);

const result = assemble(program);

console.log("\n=== Assembly Results ===\n");
console.log(`Code size: ${result.bytes.length} bytes`);
console.log(`Load address: $0300\n`);

console.log("Symbol table:");
for (const [name, value] of Object.entries(result.symbols)) {
  console.log(`  ${name.padEnd(10)} = $${value.toString(16).padStart(4, "0").toUpperCase()}`);
}

console.log("\nMachine code:");
let addr = 0x0300;
for (let i = 0; i < result.bytes.length; i += 8) {
  const bytes = Array.from(result.bytes.slice(i, i + 8));
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  console.log(`  ${addr.toString(16).padStart(4, "0").toUpperCase()}: ${hex}`);
  addr += bytes.length;
}

console.log("\n✅ Assembly complete!");
