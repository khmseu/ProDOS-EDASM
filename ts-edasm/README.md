# ts-edasm

TypeScript reimplementation of the EDASM assembler from the PRODOS Assembler Tools 1.1 set.

## Status

✅ **Core assembler implemented** - The assembler is functional with the following features:

- Complete 6502 instruction set with all addressing modes (including indexed-indirect)
- EDASM assembler directives (ORG, EQU, DB/DFB, DW/DA, DDB, ASC, DCI, STR, HEX, DS, DSECT/DEND, MSB)
- Conditional assembly (DO, IF, ELSE, FIN, IFNE, IFEQ, IFGT, IFGE, IFLT, IFLE)
- Two-pass assembly (symbol table generation and code emission)
- Automatic zeropage optimization
- Relative addressing for branch instructions
- Left-to-right expression evaluation (EDASM-style)
- Program counter (*) reference in expressions
- EDASM fielded source format support
- Structure definitions (DSECT/DEND) without emitting bytes
- MSB control for ASCII string output
- **Octal constants (@prefix) support**
- **INCLUDE directive for file inclusion with nesting**
- **Program counter (*) as expression value**
- **Indexed-indirect (zp,X) addressing mode**

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

const result = assemble(source, { 
  listing: false,
  basePath: '.' // Optional: base path for INCLUDE directive resolution
});
console.log(result.bytes); // Uint8Array of assembled machine code
console.log(result.symbols); // Symbol table
```

### Using INCLUDE Directive

```typescript
// main.s
const mainSource = `
        ORG $1000
        INCLUDE "constants.s"
START   LDA #BELL
        RTS
`;

// Assemble with basePath to resolve includes
const result = assemble(mainSource, { 
  basePath: './src' // Directory where constants.s is located
});
```

## Building

```bash
npm install
npm run build
```

## Testing

Test files are provided but excluded from the build:

```bash
# Run the comprehensive test suite
npm run test

# Run individual test files
node test_octal.mjs      # Test octal constant support
node test_include.mjs    # Test INCLUDE directive
node test_commonequs.mjs # Test with real EdAsm source files
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

**Data Definition:**
- ORG: Set origin address
- EQU: Define constant
- DB/DFB: Define byte
- DW/DA: Define word (16-bit, little-endian)
- DDB: Define double byte (16-bit, big-endian)
- ASC: ASCII string
- DCI: Dextral Character Inverted (last char with high bit set)
- STR: String with length prefix (Pascal-style string)
- HEX: Hex bytes
- DS: Define storage (reserve bytes)

**Structure Definition:**
- DSECT: Start data section (defines labels without emitting bytes)
- DEND: End data section

**Conditional Assembly:**
- DO/IF: Start conditional block (if expression != 0)
- ELSE: Conditional else
- FIN: End conditional block
- IFNE: If not equal to zero
- IFEQ: If equal to zero
- IFGT: If greater than zero
- IFGE: If greater or equal to zero
- IFLT: If less than zero
- IFLE: If less or equal to zero

**Output Control:**
- MSB: Control high bit for ASCII output (MSB ON/OFF)

**File Operations:**
- INCLUDE: Include another source file at current position (supports nesting)

### Expression Syntax

- Decimal: 123
- Hexadecimal: $7F or 0xFF
- Binary: %10101010 or 0b10101010
- Octal: @777
- Program Counter: * (current assembly address)
- Operators: +, -, \*, / (left-to-right evaluation)
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
- Indexed-Indirect (zp,X): LDA ($80,X)
- Indirect-Indexed (zp),Y: LDA ($80),Y

## Next steps

1. Implement enhanced listing format (proper field widths, expression results, cycle timing)
2. Add support for more control directives (PAGE, SKP, REP, CHR, SBTL)
3. ~~Implement file directives (INCLUDE, MACLIB, CHN)~~ ✅ INCLUDE implemented
4. Add relocatable output format (REL mode with RLD)
5. Implement macro expansion support
6. Add EXTRN/ENTRY support for external symbols
7. Add fixtures/tests using samples from ASM sources to verify compatibility

## Recent Updates

### 2026-01-15
- ✅ Added octal constant support (@prefix for numbers like @777)
- ✅ Implemented INCLUDE directive with recursive file inclusion
- ✅ Added circular include detection
- ✅ **Program counter (*) reference support for expressions**
  - Enables `EQU *` to define label at current PC
  - Supports arithmetic like `EQU *-1` and `EQU *+10`
- ✅ **Indexed-indirect addressing mode (zp,X)**
  - Added support for `(zp,X)` syntax
  - Implemented for ADC, AND, CMP, EOR, LDA, ORA, SBC, STA
  - Fixed indirect-y operand size (was incorrectly using 2 bytes, now correctly 1 byte)
- ✅ Enhanced TypeScript configuration with node types support
- ✅ All existing tests pass with new features
