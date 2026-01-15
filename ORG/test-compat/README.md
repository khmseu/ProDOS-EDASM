# Test-Compatible Assembly Files

This directory contains versions of the EdAsm-master assembly source files with headers modified for EDASM assembler compatibility.

## Purpose

The original `.S` files in `EdAsm-master/EDASM.SRC/` were generated using the DiskBrowser utility and contain metadata headers in this format:

```
Name          : FILENAME.S
End of file   :   12,345
This file was generated using the DiskBrowser utility with minimal editing.
It is meant for viewing purposes only.
```

While useful for documentation, these headers are not valid EDASM assembler syntax and would cause parsing errors when attempting to assemble the files.

## Changes Made

All `.S` files have been converted to use proper EDASM comment syntax:

```asm
;==============================================================================
; Name          : FILENAME.S
; End of file   :   12,345
; This file was generated using the DiskBrowser utility with minimal editing.
; It is meant for viewing purposes only.
;==============================================================================
```

The conversion:
- Wraps the metadata in a comment block using semicolon (`;`) comment syntax
- Adds visual separators (`;===...===`) for clarity
- Preserves all original metadata information
- Maintains the exact same content after the header

## File Structure

```
test-compat/
├── ASM/           - Assembler source files
├── BUGBYTER/      - BugByter debugger source files
├── EDITOR/        - Editor source files
├── EI/            - EdAsm Interpreter source files
├── LINKER/        - Linker source files
└── COMMONEQUS.S   - Common equates (already had correct format)
```

## Usage

These files can now be processed by EDASM-compatible assemblers such as:
- The ts-edasm TypeScript implementation in `../ts-edasm/`
- Original Apple II EDASM assembler
- Other EDASM-compatible assemblers

## Original Files

The original unmodified files remain in `EdAsm-master/EDASM.SRC/` for reference and archival purposes.

## Testing

To test a file with ts-edasm:

```bash
cd ../../ts-edasm
npm run build
# Then use the assembler API to process files from test-compat/
```

## Notes

- All 22 `.S` files in subdirectories have been converted
- COMMONEQUS.S was copied as-is (already had proper comment format)
- The conversion process preserved all original code and comments
- These files are ready for assembly and testing with EDASM tools
