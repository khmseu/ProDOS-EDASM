# EDASM Assembler Source Files (ASM Directory)

## Overview

This directory contains the source code for the EDASM assembler component of the ProDOS Assembler Tools Release 1.1. The assembler is responsible for converting 6502/65C02 assembly language source code into machine code.

## Files in This Directory

The assembler is split across multiple source files:

- **ASM1.S** - Main assembler code (Part 1)
  - Symbol table management and printing (Pass 3)
  - Sorting algorithms for symbol and address listings
  - Memory management for symbol storage

- **ASM2.S** - Assembler code (Part 2)
  - Additional assembler functionality
  - Expression evaluation
  - Code generation

- **ASM3.S** - Assembler code (Part 3)
  - Directive processing
  - Final assembly operations

## Architecture

The EDASM assembler follows a multi-pass design:

### Pass 1: Symbol Table Generation
- Scans the source file
- Builds the symbol table with labels and their addresses
- Identifies forward references
- Records equates (EQU directive)

### Pass 2: Code Generation
- Resolves all symbols and addresses
- Generates machine code
- Handles addressing mode selection (zero page vs absolute)
- Processes assembler directives

### Pass 3: Symbol Table Listing (Optional)
- Sorts symbols alphabetically or by address
- Prints formatted symbol table
- Identifies undefined symbols (*), unreferenced symbols (?), ENTRY symbols (N), and EXTERN symbols (X)

## Memory Layout

The assembler is loaded in two parts:

1. **$6800-$77FF**: Code that gets relocated to Language Card Bank 2 ($D000-$DFFF)
   - Symbol table printing and sorting routines
   - This code can use the upper 4KB of RAM when Language Card is enabled

2. **$7800-$9EFF**: Resident code that remains at load address
   - Main assembly engine
   - Expression evaluator
   - Code generator

## Key Data Structures

### Symbol Table
Each symbol table entry contains:
- **Symbol name**: Variable length (up to 14 characters), null-terminated with high bit set on last character
- **Flag byte**: Bits indicate:
  - Bit 7: Symbol defined (1) or undefined (0)
  - Bit 6: Unreferenced symbol
  - Bit 4: EXTERN declaration
  - Bit 3: ENTRY declaration
  - Bit 0: Forward reference
- **Address**: 16-bit value associated with the symbol

### Symbol Table Sorting
The assembler can sort symbols two ways:
1. **Alphabetically**: Creates 2-byte entries (pointer to symbol)
2. **By Address**: Creates 4-byte entries (pointer to symbol + address value)

## Target Audience Notes

### ProDOS-Specific Features
- Uses ProDOS MLI (Machine Language Interface) for file operations
- Symbol table can be saved to disk for linking
- Supports ProDOS pathname conventions

### Sweet-16 Usage
The assembler uses Steve Wozniak's Sweet-16 pseudo-machine interpreter for 16-bit arithmetic operations:
- R0-R15: 16-bit registers mapped to zero page $00-$1F
- Provides efficient 16-bit operations on 8-bit 6502
- Used extensively for pointer manipulation and address calculations

### Language Card Management
The Apple ][ Language Card provides 16KB of extra RAM that can replace ROM:
- Bank switching allows code at $D000-$FFFF to be RAM instead of ROM
- ASM1.S code relocates to $D000 in LC Bank 2
- This frees up memory in main RAM for larger symbol tables

## Assembler Directives Supported

- **ORG**: Set origin address for code generation
- **EQU**: Define a symbolic constant
- **DB/DFB**: Define byte(s)
- **DW/DA**: Define word (16-bit value)
- **ASC**: ASCII text string
- **DCI**: Dextral Character Inverted (last char with bit 7 set)
- **HEX**: Hexadecimal bytes
- **DS**: Define storage (reserve bytes)
- **ENTRY**: Mark symbol for export to linker
- **EXTERN**: Mark symbol as externally defined
- **CHR**: Set comment character (default ';')
- **MSB**: Control assembly listing format

## Code Generation

### Addressing Mode Selection
The assembler automatically selects the most efficient addressing mode:
- Zero page if address is $00-$FF (saves 1 byte)
- Absolute if address is $0100-$FFFF

### Branch Optimization
- Calculates relative offsets for branch instructions (BEQ, BNE, BCC, etc.)
- Ensures offset is in range (-128 to +127 bytes)
- Reports error if branch target is too far

### Expression Evaluation
- Left-to-right evaluation (no operator precedence)
- Supports: +, -, *, / operators
- Handles immediate values, symbols, and expressions
- Low byte: < operator
- High byte: > operator

## Symbol Table Output Format

When listing symbols, the following markers are used:
- `*` - Symbol referenced but never defined (undefined symbol)
- `?` - Symbol defined but never referenced (dead code warning)
- `X` - EXTERN symbol (defined in another module)
- `N` - ENTRY symbol (exported for linking)
- (space) - Normal local symbol

Example symbol table output:
```
  SYMBOL       TABLE SORTED       BY SYMBOL
  
  8000 START                ?C00 BUFFER
 *     UNDEFINED            X    EXTERN_SYM
 N8100 ENTRY_POINT
```

## References

For more information about EDASM:
1. **EDASM Manual**: ProDOS Assembler Tools documentation
2. **Beneath Apple ProDOS**: Details on ProDOS file structures
3. **Sweet-16 Manual**: Steve Wozniak's pseudo-machine documentation
4. **Apple ][ Reference Manual**: Monitor ROM routines and hardware

## See Also

- **../COMMONEQUS.S**: Common equates shared across all EdAsm modules
- **../EDITOR/**: Source files for the text editor component
- **../LINKER/**: Source files for the linking tool
- **../BINDER/**: Source files for the binder utility
