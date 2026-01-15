#!/usr/bin/env node
// Debug macro parsing

import { Parser } from "./dist/parser.js";

const test = `
    ORG $1000

STORE   MACRO
    LDA #&1
    STA &2
    ENDM

    STORE $42,$2000
    RTS
`;

console.log("Parsing source...\n");

const parser = new Parser(test);
const { statements } = parser.parse();

console.log(`Parsed ${statements.length} statements:\n`);

statements.forEach((stmt, i) => {
    console.log(`[${i}] Label: ${stmt.label || 'none'}, Opcode: ${stmt.opcode || 'none'}, Directive: ${stmt.directive || 'none'}`);
    if (stmt.operand) {
        console.log(`    Operand: ${stmt.operand.kind} = ${stmt.operand.kind === 'symbol' ? stmt.operand.name : stmt.operand.kind === 'literal' ? stmt.operand.value : 'complex'}`);
    }
});
