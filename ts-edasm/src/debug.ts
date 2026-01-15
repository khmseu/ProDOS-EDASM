#!/usr/bin/env node
import { Parser } from "./parser.js";

// Test simple 6502 assembly
const testProgram = `
        ORG $1000
START   LDA #$00
        STA $2000
        INX
        BNE START
        RTS
`;

console.log("Parsing test...\n");

const parser = new Parser(testProgram);
const { statements, tokens } = parser.parse();

console.log(`Parsed ${statements.length} statements\n`);

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  console.log(`Statement ${i}:`);
  console.log(`  Label: ${stmt.label || "(none)"}`);
  console.log(`  Opcode: ${stmt.opcode || "(none)"}`);
  console.log(`  Directive: ${stmt.directive || "(none)"}`);
  console.log(
    `  Operand: ${stmt.operand ? JSON.stringify(stmt.operand) : "none"}`,
  );
  console.log(`  Addressing: ${stmt.addressing || "none"}`);
  console.log(`  Comment: ${stmt.comment || "none"}`);
  console.log();
}
