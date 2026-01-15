# ts-edasm

TypeScript reimplementation of the EDASM assembler from the PRODOS Assembler Tools 1.1 set.

## References

- Language summary: ../ORG/EDASM_ASSEMBLER_LANGUAGE.md
- Original symbols/constants: ../ORG/EdAsm-master/EDASM.SRC/COMMONEQUS.S
- Original assembler source: ../ORG/EdAsm-master/EDASM.SRC/ASM/

## Project layout

- src/index.ts: public entry point exporting `assemble`.
- src/assembler.ts: two-pass assembler shell.
- src/parser.ts: statement and expression parser (left-to-right expressions).
- src/lexer.ts: tokenizer skeleton for label/opcode/directive/comment fields.
- src/types.ts: shared types for tokens, statements, expressions, and options.

## Next steps

1. Populate opcode and directive tables (6502 + EDASM pseudo ops).
2. Implement lexer respecting fielded input and comment rules.
3. Implement parser with EDASM expression semantics (left-to-right evaluation).
4. Build pass-one symbol table and pass-two emission (bin and relocatable output).
5. Add fixtures/tests using samples from ASM sources to verify compatibility.
