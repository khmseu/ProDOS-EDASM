# EDASM Assembler — Language Reference (reimplementation spec)

## Changelog

### 2026-01-15 - Documentation Update
**Changes made to align documentation with actual ASM implementation:**

1. **Added missing directives:**
   - `STR` - String with length prefix directive
   - `SET` - Sweet-16 pseudo-opcode for register assignment
   - `INCLUDE` - Include file support with nesting
   - `MACLIB` - Macro library file specification
   - `PAUSE` - Manual disk swap support
   - `IBUFSIZ/SBUFSIZ` - Buffer sizing directives
   - `SW16` - Sweet-16 interpreter address specification
   - `X6502` - 65C02 opcode control
   - `DATE/TIME/IDNUM` - Timestamp embedding
   - `FAIL` - Conditional error reporting
   - Additional conditional variants: `IFNE`, `IFEQ`, `IFGT`, `IFGE`, `IFLT`, `IFLE`

2. **Enhanced existing directive documentation:**
   - `DS` - Added note about optional fill byte value
   - `DO/ELSE/FIN` - Added nesting restrictions and conditional variants
   - `DFB` - Clarified RLD entry creation per byte for relocatable expressions

3. **Added implementation details:**
   - Symbol table structure (hash-based, 128-entry header, flag byte details)
   - Relocation Dictionary (RLD) format specification (4-byte entries)
   - Symbol name constraints (14 characters for display, high-bit encoding)
   - Expression evaluation restrictions (bit operators, division in REL mode)
   - "First simple operand" rule for addressing mode selection
   - Low/high byte operator handling for EXTRN symbols

4. **Added macro features documentation:**
   - Parameter substitution (`&0`-`&9`, `&X`)
   - Parameter count in `&0`
   - Unique label generation with `&X`
   - Macro expansion restrictions in conditional blocks

5. **Added system architecture notes:**
   - File management (5 simultaneous files)
   - Sweet-16 usage for 16-bit operations
   - ORG restrictions for relocatable files (> $100)

---

This document extracts the assembler input language rules from the original Apple II "Assembler/Editor" manual text (files in `edasm/*.txt`) and summarizes them in a concise form suitable for re-implementation.

## Overview
- The assembler is a two-pass assembler for the MOS 6502 family. It reads source files (and supports chaining via `CHN`) and outputs either binary memory-image files or relocatable object files (when `REL` is specified).
- The assembler keeps a symbol table and, when producing relocatable output, a relocation dictionary (RLD) and an External Symbol Directory (ESD) for `EXTRN`/`ENTRY` usage.

---

## Source format and fields
Each source statement may be formatted in fields (typical editor format):
- Optional `label` field (a label may precede any required syntax).
- An `opcode` field (either an operation code or a pseudo-op / directive).
- An optional `operand` field.
- Optional comment field introduced by a semicolon (`;`). A line that begins with `*` or `;` in column 1 is a comment line.

Notes:
- The comment field should be separated from the operand by ` ; ` (space + semicolon). The assembler can sometimes deduce comment start without the semicolon, but tools may depend on it.
- Lines that are directives (pseudo-ops) are entered in the opcode field and act like opcodes but do not generate object code themselves (unless they define data).

---

## Labels
- A label is a symbolic name for a 16-bit value.
- Two logical kinds of label values: "zero-page" (high byte = 0) and non-zero-page.
- If a label occurs on a statement that generates code or reserves storage, the label value is the current program address counter.
- If a label occurs on `EQU`, it is assigned the value of the evaluated operand expression.
- Labels used in operands are substituted with their numeric value during expression evaluation.
- Symbol names can be up to 14 characters for display purposes, though longer names are handled internally.
- Internally, symbols are stored with the high bit SET on all characters except the last character, which is null-terminated.

---

## Constants
Four constant types are recognized in expressions:
1. Decimal constants (default) — sequence of digits 0..9, value 0..65535.
2. Hexadecimal constants — preceded by `$` (dollar sign), digits 0..9,A..F.
3. Octal constants — preceded by `@` (at sign), digits 0..7.
4. String constants — delimited by single quotes `'...'
   - Strings may be up to 240 characters.
   - A one-character immediate string used with `#` may omit a trailing quote in some cases (per docs).

Numeric range: numeric constants must fit in 16 bits, otherwise a numeric overflow error is generated.

Reserved single-character identifiers (A, X, Y, P, S) are permitted as labels in this assembler, but using them as operand labels is discouraged (and `A` cannot be used as a label in an operand expression).

---

## Expressions and evaluation
- Expressions are built from constants, labels, and arithmetic operators.
- Important: the manual states that **operators are left-to-right with no precedence**; reimplementation should evaluate left-to-right.
- The assembler evaluates expressions in pass two, after all symbol definitions from pass one are available.
- When determining whether an addressing mode is zero-page vs. absolute, the assembler looks only at the **first simple operand** of the expression (the "first simple operand" rule).

Operators: (common ones used in classic assemblers are expected — `+`, `-`, `*`, `/`, bitwise ops `&`, `|`, `^`; the manual emphasizes left-to-right evaluation.)

Important notes:
- Bit operators (`&`, `|`, `^`) have restrictions on relocatable expressions.
- Division (`/`) has limitations in REL (relocatable) mode.
- Low/high byte operators (`<`, `>`) have special handling for EXTRN symbols.

---

## Addressing modes and operand notations
The assembler recognizes standard 6502 addressing modes and common notations:
- Implied (no operand)
- Accumulator: `opc A`
- Immediate: `opc #expression`
- Low byte: `opc #<expression` (or implied `#<` syntax)
- High byte: `opc #>expression`
- Zero page: `opc zpg-expression`
- Zero page,X: `opc zpg-expression,X`
- Zero page,Y: `opc zpg-expression,Y`
- Absolute: `opc abs-expression`
- Absolute,X: `opc abs-expression,X`
- Absolute,Y: `opc abs-expression,Y`
- Indirect: `opc (zpg-expression)` or `opc (zpg-expression),Y` per 6502 conventions
- JMP indirect: `JMP (zpg-expression)`

(See `image-051.txt` addressing table for a concise mapping.)

---

## Comment syntax
- Comments: `;` starts a comment (or `*` in column 1 makes the entire line a comment).
- Comments may contain arbitrary ASCII characters.

---

## Pseudo-ops / Directives (summary and semantics)
This is a condensed list of directives documented in the manual. For each directive, reimplementation notes and important behaviors are included.

- ORG (ORiGin)
  - Sets program counter to specified address.
  - Affects where subsequent code/data are placed.

- OBJ (OBject)
  - Controls the object file name/creation (details used by ASM invocation; handle via assembler CLI wrapper).

- EQU (EQUate)
  - Assigns the value of an expression to a label.
  - Example: `FOO EQU $10` sets `FOO` to $10.

- MSB
  - Controls the most significant bit used when generating ASCII character bytes from string constants and `ASC` output. Defaults to ON (1) in this assembler.

- DSECT / DEND
  - Start/end of a data-section; DSECT defines label addresses without emitting object bytes (useful for describing structures).

- REL (RELocatable)
  - When specified at the beginning of an assembly, causes relocatable objects to be produced and RLD (relocation) records to be emitted.

- EXTRN (EXTeRNal)
  - Declares an external symbol. External symbols are always treated as multi-byte (not zero-page), and the assembler allows these to remain undefined so the linker or later pass can resolve them.

- ENTRY
  - Marks symbols that may be referenced externally; used to populate ESD for relocatable files.

- DO / ELSE / FIN (conditional assembly)
  - Basic conditional assembly facility; `DO expression` includes the following block if expression is non-zero (otherwise it is skipped to `ELSE` or `FIN`). `ELSE` toggles which block is included. `FIN` ends the conditional.
  - Additional conditional variants: `IFNE` (if not equal), `IFEQ` (if equal), `IFGT` (if greater than), `IFGE` (if greater or equal), `IFLT` (if less than), `IFLE` (if less or equal).
  - Conditional assembly blocks cannot be nested across include or macro file boundaries.

- PAGE
  - Causes a page eject in the listing (form-feed character) and prints a blank line on screen. It does not itself print as a listing line (but its effect is visible).

- LIST / LST ON / LST OFF
  - Controls source listing output; `LST OFF` will suppress source listing; `LST ON` re‑enables it. `LST OFF` at the start suppresses everything but symbol tables (per manual).

- REP / CHR
  - `REP expression` prints a repeated character (default `*`) a number of times (modulo 256). `CHR ?` sets the character to repeat.

- SKP
  - `SKP expression` inserts blank lines in the listing (sends CRs to the output device).

- SBTL Dstring
  - Subtitle directive — string used as top-line title for each page of listing.

Data directives
- ASC Dstring
  - Writes ASCII bytes for the string, influenced by the `MSB` setting. If a label is on `ASC`, label gets the address of first char.

- DCI Dstring
  - Like `ASC`, but MSB bits are set such that all bytes except the last have MSB=0 and the last has MSB=1 (used for certain encoded strings; `MSB` pseudo does NOT control DCI behavior).

- STR Dstring
  - String with length prefix: emits a single byte containing the string length (0-255) followed by the string bytes. The `MSB` setting influences the string bytes.

- DFB expr[,expr,...]
  - Define bytes; each expression evaluated modulo 256 becomes a byte. Comma separates expressions. If expressions are relocatable, RLD entries are made per byte.

- DW expression
  - Define word (16-bit) stored little-endian: low byte first, high byte second.

- DDB expression
  - Define double byte: same as `DW` but stored in reverse order (high byte first, then low byte).

- DS expression
  - Reserve `expression` bytes of space (no object bytes emitted when inside `DSECT` — there it defines data structure size only). DS expression must not contain forward references. Optionally accepts a fill byte value.

Other directives
- CHN sourceFilename[,slot exp[,drive exp]]
  - Chains another source file: assembler starts reading the chained file and continues. Optional slot and drive expressions select disk position. All statements after `CHN` in current file are ignored (CHN typically final statement in file).

- INCLUDE sourceFilename
  - Includes another source file at the current position. Unlike `CHN`, assembly continues with the next line after the include completes. Supports nesting with separate line numbering per file.

- MACLIB macroFilename
  - Specifies a macro library file for macro expansion. Macros can be invoked by name, with parameters passed as `&1`, `&2`, ..., `&9`. The `&0` parameter contains the parameter count, and `&X` generates unique labels.

- PAUSE
  - Pauses assembly and prompts for manual disk swap (for multi-disk source files).

- IBUFSIZ / SBUFSIZ
  - Sets input or source buffer sizes dynamically. Must be declared before the first symbol definition.

- SW16 address
  - Specifies the address of the Sweet-16 interpreter entry point for 16-bit arithmetic operations.

- X6502 ON/OFF
  - Enables or disables 65C02-specific opcodes in the assembler.

- DATE / TIME / IDNUM
  - Embeds timestamp or identification number in the object code.

- FAIL expression
  - Conditional error reporting: generates an assembly error if the expression evaluates to non-zero.

- SET
  - Sweet-16 pseudo-opcode for register assignment (used within Sweet-16 code blocks).

---

## Object file formats
- Binary memory-image files: standard DOS binary format, suitable for BLOAD/BRUN.
- Relocatable (`REL`) files: include relocation dictionary and optional ESD (external symbols) for linking.
- When generating relocatable output, the assembler emits relocation records for relocatable expressions and may include an External Symbol Directory (ESD) when `EXTRN`/`ENTRY` are used.

### Symbol Table Structure
- The assembler uses a hash-based symbol table with 128-entry header table for efficient lookup.
- Each symbol entry contains:
  - Symbol name (variable length, up to 14 characters for display)
  - Flag byte with bits indicating:
    - Bit 7: Symbol defined (1) or undefined (0)
    - Bit 6: Unreferenced symbol
    - Bit 4: EXTERN declaration
    - Bit 3: ENTRY declaration
    - Bit 0: Forward reference
  - 16-bit address value

### Relocation Dictionary (RLD) Format
- Built downwards from high memory (MEMTOP) towards the symbol table.
- Each RLD entry is 4 bytes: offset (2 bytes), flag byte, symbol/address info.
- Supports both 8-bit and 16-bit relocatable values.
- When using `DFB` with relocatable expressions, an RLD entry is created per byte.
- ORG values for relocatable files should typically be greater than $100.

---

## Assembler behavior & runtime notes
- Two-pass assembler: Pass one establishes labels and sizes as needed; pass two generates code and final values.
- The assembler prints chained file names as it begins them. During pass one it prints a dot for every 100 lines to indicate progress.
- During pass two, listing to the video or printer may be suspended or single stepped via keyboard controls (implementation detail of interactive run-time; not relevant to non-interactive assembler).

---

## Error handling hints
- The assembler reports numeric overflow when a numeric expression exceeds 16 bits.
- CHN of a missing filename causes an OOPS error; disk I/O errors abort assembly.
- The assembler permits `EXTRN` symbols to remain undefined (so no undefined symbol error when `EXTRN` is used).

---

## Implementation guidance and notes
- Expressions: implement left-to-right evaluation; allow parentheses if desired as an extension, but ensure left-to-right semantics match manual examples.
- Be strict about numeric literal prefixes: `$` = hex, `@` = octal, decimal otherwise.
- Allow single-quoted string constants with up to 240 chars.
- Implement label assignment semantics exactly: labels on code/data statements get current PC; `EQU` sets explicit value.
- Listing directives affect output only; they should not generally change object-generation semantics (except where documented, e.g., `DS` in `DSECT`).

### Macro Features
- Macros support parameter substitution using `&0` through `&9`.
- `&0` contains the parameter count (0-9).
- `&1` through `&9` are positional parameters.
- `&X` generates unique labels within macro expansions to avoid conflicts.
- Macro expansion is disabled inside conditional assembly blocks.

### File Management
The assembler can manage up to 5 files simultaneously:
- File 0: Object code output (OBJ)
- File 2: Source file (SRC)
- File 4: Include file (INCLUDE)
- File 6: Macro library file (MACLIB)
- File 8: Listing output (LIST)

### Sweet-16 Usage
The assembler uses Steve Wozniak's Sweet-16 pseudo-machine interpreter for efficient 16-bit arithmetic operations:
- R0-R15: 16-bit registers mapped to zero page $00-$1F
- Provides efficient 16-bit operations on the 8-bit 6502
- Used extensively for pointer manipulation and address calculations

Caveat: the manual describes many editor and runtime behaviors which are interactive (screen printer control, page lengths and device control strings, keyboard-driven listing pause, and more). Those are outside a minimal non-interactive assembler implementation and can be omitted or simulated by the host command wrapper.

---

## Missing details / assumptions
- The original manual describes the conditional assembly DO/ELSE/FIN feature but does not fully specify evaluation details for corner cases; implement conventional behavior: `DO expr` begins a conditional block (true/non-zero includes), `ELSE` toggles, `FIN` ends. The original docs may allow nested conditionals; support nesting if possible.
- There is evidence of other directives (some variants and detailed printer control sequences) that are tool-specific; focus on the directives and features above for a reimplementation.

---

## Examples
- Label and origin
```asm
START  ORG $1000
LOOP   LDA #$01 ; load #1
       STA $0200
       JMP LOOP
```

- Defining data and ASCII
```asm
MSG    ASC 'HELLO'   ; ASCII bytes (MSB controlled by MSB directive)
TAB    DFB 1,2,3,4
PTR    DW $C000

data_block DS 64
```

- Conditional assembly
```asm
DO 1
   ; included
ELSE
   ; skipped
FIN
```

---

## Sources
- Derived from the Apple II Assembler/Editor manual pages in `edasm/*.txt` in this repository (files: `image-031.txt`, `image-033.txt`, `image-036.txt`, `image-037.txt`, `image-038.txt`, `image-044.txt`, `image-045.txt`, `image-046.txt`, `image-047.txt`, `image-048.txt`, `image-051.txt`, `image-063.txt`, etc.).

If you want, I can now:
- Add a small test-suite (examples from the docs) for use-by the TypeScript implementation.
- Extend the spec with detail for additional pseduo-ops or runtime behaviors (listing page formats, printer control strings, file slot/drive semantics).

---

End of EDASM Assembler language reference (spec for reimplementation).
