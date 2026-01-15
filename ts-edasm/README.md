# ts-edasm

TypeScript reimplementation of the EDASM assembler from the PRODOS Assembler Tools 1.1 set.

## Status

✅ **Core assembler implemented** - The assembler is functional with the following features:

- Complete 6502 instruction set with all addressing modes
- EDASM assembler directives (ORG, EQU, DB/DFB, DW/DA, ASC, DCI, HEX, DS)
- Two-pass assembly (symbol table generation and code emission)
- Automatic zeropage optimization
- Relative addressing for branch instructions
- Left-to-right expression evaluation (EDASM-style)
- EDASM fielded source format support

## Usage

```typescript
import { assemble } from "ts-edasm";

const source = `
        ORG $1000
START   LDA #$00
        STA $2000
        INX
        BNE START
        RTS
`;

const result = assemble(source, { listing: false });
console.log(result.bytes); // Uint8Array of assembled machine code
console.log(result.symbols); // Symbol table
```

## Building

```bash
npm install
npm run build
```

## Testing

Test files are provided but excluded from the build:

```bash
# Compile and run basic test
npx tsc src/test.ts --module NodeNext --moduleResolution NodeNext --target ES2020 --lib ES2020 --outDir dist
node dist/test.js

# Compile and run comprehensive test suite
npx tsc src/test-suite.ts --module NodeNext --moduleResolution NodeNext --target ES2020 --lib ES2020 --outDir dist
node dist/test-suite.js
```

## References

- Language summary: ../ORG/EDASM_ASSEMBLER_LANGUAGE.md
- Original symbols/constants: ../ORG/EdAsm-master/EDASM.SRC/COMMONEQUS.S
- Original assembler source: ../ORG/EdAsm-master/EDASM.SRC/ASM/

## Project layout

- src/index.ts: public entry point exporting `assemble`.
- src/assembler.ts: two-pass assembler implementation.
- src/parser.ts: statement and expression parser (left-to-right expressions).
- src/lexer.ts: tokenizer for EDASM fielded input format.
- src/types.ts: shared types for tokens, statements, expressions, and options.
- src/opcodes.ts: 6502 instruction set and EDASM directive tables.

## Supported Features

### Instructions
All 6502 instructions with appropriate addressing modes:
- Arithmetic: ADC, SBC
- Logical: AND, ORA, EOR
- Shifts/Rotates: ASL, LSR, ROL, ROR
- Loads/Stores: LDA, LDX, LDY, STA, STX, STY
- Transfers: TAX, TAY, TXA, TYA, TSX, TXS
- Stack: PHA, PLA, PHP, PLP
- Branches: BCC, BCS, BEQ, BMI, BNE, BPL, BVC, BVS
- Jumps: JMP, JSR, RTS, RTI
- Comparisons: CMP, CPX, CPY
- Increment/Decrement: INC, DEC, INX, INY, DEX, DEY
- Flags: CLC, SEC, CLI, SEI, CLD, SED, CLV
- Other: BIT, BRK, NOP

### Directives
- ORG: Set origin address
- EQU: Define constant
- DB/DFB: Define byte
- DW/DA: Define word (16-bit)
- ASC: ASCII string
- DCI: Dextral Character Inverted (last char with high bit set)
- HEX: Hex bytes
- DS: Define storage (reserve bytes)

### Expression Syntax
- Decimal: 123
- Hexadecimal: $7F or 0xFF
- Binary: %10101010 or 0b10101010
- Operators: +, -, *, / (left-to-right evaluation)
- Low byte: < (in immediate mode: #<VALUE)
- High byte: > (in immediate mode: #>VALUE)

### Addressing Modes
- Implied: NOP
- Accumulator: ASL A
- Immediate: LDA #$00
- Zero Page: LDA $80
- Zero Page,X: LDA $80,X
- Zero Page,Y: LDX $80,Y
- Absolute: LDA $1000
- Absolute,X: LDA $1000,X
- Absolute,Y: LDA $1000,Y
- Indirect: JMP ($1000)
- (Indirect),Y: LDA ($80),Y

## Next steps

1. Add support for more EDASM directives (LST, SAV, PUT, MAC, etc.)
2. Implement relocatable output format
3. Add macro expansion support
4. Implement conditional assembly (IF/ELSE/FIN)
5. Add fixtures/tests using samples from ASM sources to verify compatibility.
