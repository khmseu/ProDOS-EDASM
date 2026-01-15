# EDASM Assembler — Language Reference (reimplementation spec)

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
- When determining whether an addressing mode is zero-page vs. absolute, the assembler looks only at the **first simple operand** of the expression.

Operators: (common ones used in classic assemblers are expected — `+`, `-`, `*`, `/`, bitwise ops may be present in original implementation; the manual emphasizes left-to-right evaluation — implement at least `+` and `-` and allow parentheses if desired as extension.)

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
  - Basic conditional assembly facility; `DO expression` includes the following block if expression is non-zero (otherwise it is skipped to `ELSE` or `FIN`). `ELSE` toggles which block is included. `FIN` ends the conditional.  (Documentation describes the feature but not detailed corner-cases; implement as standard conditional directives.)

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

- DFB expr[,expr,...]
  - Define bytes; each expression evaluated modulo 256 becomes a byte. Comma separates expressions. If expressions are relocatable, RLD entries are made per byte.

- DW expression
  - Define word (16-bit) stored little-endian: low byte first, high byte second.

- DDB expression
  - Define double byte: same as `DW` but stored in reverse order (high byte first, then low byte).

- DS expression
  - Reserve `expression` bytes of space (no object bytes emitted when inside `DSECT` — there it defines data structure size only). DS expression must not contain forward references.

Other directives
- CHN sourceFilename[,slot exp[,drive exp]]
  - Chains another source file: assembler starts reading the chained file and continues. Optional slot and drive expressions select disk position. All statements after `CHN` in current file are ignored (CHN typically final statement in file).

---

## Object file formats
- Binary memory-image files: standard DOS binary format, suitable for BLOAD/BRUN.
- Relocatable (`REL`) files: include relocation dictionary and optional ESD (external symbols) for linking.
- When generating relocatable output, the assembler emits relocation records for relocatable expressions and may include an External Symbol Directory (ESD) when `EXTRN`/`ENTRY` are used.

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
