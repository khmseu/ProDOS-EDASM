# Comparison: ts-edasm vs EDASM_ASSEMBLER_LANGUAGE.md

This document analyzes the differences between the TypeScript implementation (ts-edasm) and the EDASM specification.

## Implementation Status Summary

### ✅ Fully Implemented Features

#### Core Assembly

- **6502 Instruction Set**: Complete with all standard addressing modes
  - **Indexed-Indirect `(zp,X)`**: Full support for zero-page indexed-indirect addressing
  - **Indirect-Indexed `(zp),Y`**: Full support for zero-page indirect-indexed addressing
- **Two-Pass Assembly**: Symbol table generation (pass 1) and code emission (pass 2)
- **Automatic Zero Page Optimization**: Detects when addresses fit in zero page
- **Relative Branch Addressing**: Automatic calculation for branch instructions
- **Expression Evaluation**: Left-to-right evaluation matching EDASM style
- **Program Counter Reference `*`**: Full support for `*` in expressions (e.g., `EQU *`, `EQU *-1`, `EQU *+10`)

#### Source Format

- **Fielded Input**: Label, opcode, operand, and comment fields
- **Comment Syntax**: Semicolon (`;`) and asterisk (`*`) in column 1
- **Labels**: Up to 14 characters, assigned to PC or EQU values

#### Constants and Expressions

- **Decimal Constants**: Default numeric format
- **Hexadecimal**: `$` prefix (e.g., `$FF`)
- **Binary**: `%` prefix and `0b` prefix (e.g., `%10101010`, `0b10101010`)
- **String Constants**: Single-quoted strings
- **Operators**: `+`, `-`, `*`, `/` with left-to-right evaluation
- **Low/High Byte**: `<` and `>` operators
- **Current PC**: `*` symbol evaluates to current program counter

#### Data Definition Directives

- **ORG**: Set origin address ✅
- **EQU**: Define constant ✅
- **DFB/DB**: Define byte(s) ✅
- **DW/DA**: Define word (little-endian) ✅
- **DDB**: Define double byte (big-endian) ✅
- **ASC**: ASCII string ✅
- **DCI**: Dextral Character Inverted (last char with high bit set) ✅
- **STR**: String with length prefix ✅
- **HEX**: Hex bytes ✅
- **DS**: Define storage (reserve bytes) ✅

#### Structure Definition

- **DSECT**: Start data section (defines labels without emitting bytes) ✅
- **DEND**: End data section ✅

#### Conditional Assembly

- **DO/IF**: Start conditional block ✅
- **ELSE**: Conditional else ✅
- **FIN**: End conditional block ✅
- **IFNE**: If not equal to zero ✅
- **IFEQ**: If equal to zero ✅
- **IFGT**: If greater than zero ✅
- **IFGE**: If greater or equal to zero ✅
- **IFLT**: If less than zero ✅
- **IFLE**: If less or equal to zero ✅

#### Output Control

- **MSB**: Control high bit for ASCII output (MSB ON/OFF) ✅

### ⚠️ Partially Implemented / Needs Enhancement

#### Listing Format

- **Basic listing**: Implemented but needs enhancement
- **Field widths**: Not matching spec exactly (PC:5, Code:12, ER/Cycles:3, Line#:5)
- **Expression results**: Not displayed in 3-char field at correct position
- **Cycle timing**: Not implemented (cycle count display)
- **Suppressed assembly indicator**: 'S' for false conditionals - needs verification
- **Multi-line continuations**: For >4 bytes generated - needs verification

#### Listing Control Directives

- **LST ON/OFF**: Basic support exists, needs full testing
- **PAGE**: Not implemented (page eject)
- **SKP**: Not implemented (blank lines)
- **REP**: Not implemented (repeated character)
- **CHR**: Not implemented (set repeat character)
- **SBTL**: Not implemented (subtitle)

### ❌ Not Yet Implemented

#### File Directives

- **CHN**: Chain source file - **NOT IMPLEMENTED**
- **INCLUDE**: Include file support - **NOT IMPLEMENTED**
- **MACLIB**: Macro library file - **NOT IMPLEMENTED**
- **PAUSE**: Manual disk swap - **NOT IMPLEMENTED**

#### Relocatable Output

- **REL**: Relocatable mode - **NOT IMPLEMENTED**
- **EXTRN**: External symbols - **NOT IMPLEMENTED**
- **ENTRY**: Entry points for linking - **NOT IMPLEMENTED**
- **Relocation Dictionary (RLD)**: Not generated
- **External Symbol Directory (ESD)**: Not generated

#### Macro System

- **Macro definition**: **NOT IMPLEMENTED**
- **Macro expansion**: **NOT IMPLEMENTED**
- **Parameter substitution**: `&0`-`&9`, `&X` - **NOT IMPLEMENTED**

#### Advanced Features

- **IBUFSIZ/SBUFSIZ**: Buffer sizing - **NOT IMPLEMENTED**
- **SW16**: Sweet-16 interpreter address - **NOT IMPLEMENTED**
- **X6502**: 65C02 opcode control - **NOT IMPLEMENTED**
- **DATE/TIME/IDNUM**: Timestamp embedding - **NOT IMPLEMENTED**
- **FAIL**: Conditional error reporting - **NOT IMPLEMENTED**
- **SET**: Sweet-16 pseudo-opcode - **NOT IMPLEMENTED**

#### Octal Constants

- **Octal**: `@` prefix (e.g., `@777`) - **NOT IMPLEMENTED**
  - Note: Spec says octal is supported, but ts-edasm doesn't have it

#### Additional Missing from Spec

- **OBJ**: Object file name control - **NOT IMPLEMENTED**

## Priority Recommendations

Based on the analysis and the spec, here are recommended priorities for implementation:

### High Priority (Core Functionality)

1. **INCLUDE directive**: Essential for modular assembly projects
2. **Octal constants**: Specified in the language spec
3. **Enhanced listing format**: Match the exact field widths and formatting from spec
4. **Expression results display**: Show 4-digit hex in 3-char field

### Medium Priority (Compatibility)

5. **PAGE/SKP directives**: Common in existing source files
6. **REL mode with RLD**: Required for relocatable output
7. **EXTRN/ENTRY**: Required for multi-module projects
8. **65C02 support (X6502)**: Expand instruction set

### Low Priority (Advanced Features)

9. **Macro system**: Complex but useful feature
10. **CHN directive**: Less common in modern workflows
11. **Sweet-16 features**: Specialized use case
12. **FAIL directive**: Nice-to-have for validation

## Test Coverage Recommendations

Current test suite covers:

- Basic instruction assembly ✅
- Data directives ✅
- Conditional assembly ✅
- MSB control ✅
- DSECT/DEND ✅
- Program counter reference `*` ✅
- Indexed-indirect addressing `(zp,X)` ✅
- Indirect-indexed addressing `(zp),Y` ✅
- Combined PC reference and indexed-indirect ✅

Need tests for:

- INCLUDE directive
- Octal constants
- REL mode output
- EXTRN/ENTRY symbols
- Listing format verification
- File I/O error handling, including full support for program counter references (`*`) and indexed-indirect addressing modes. The main remaining gaps are:

1. **File inclusion**: INCLUDE directive missing
2. **Octal constants**: `@` prefix not implemented
3. **Relocatable output**: REL/EXTRN/ENTRY system not implemented
4. **Macro system**: Complete macro support missing
5. **Listing enhancements**: Format needs refinement to match spec exactly

The implementation successfully assembles most EdAsm source files including complex patterns like `EQU *` and `(zp,X)` addressing. It is suitable for many assembly tasks but needs additional features for full compatibility with the EdAsm toolchain, particularly file inclusion and 4. **Listing enhancements**: Format needs refinement to match spec exactly 5. **Octal constants**: Missing from parser

The implementation is suitable for simple assembly tasks but needs additional features for compatibility with the full EdAsm source code in the ORG directory, particularly file inclusion and potentially relocatable output support.
