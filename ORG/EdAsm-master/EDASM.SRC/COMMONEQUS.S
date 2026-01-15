;==============================================================================
; COMMONEQUS.S - Common Equates for EdAsm Assembler Tools
;==============================================================================
; Name          : COMMONEQUS.S
; End of file   :    6,161
;
; This file was generated using the DiskBrowser utility with minimal editing.
; It is meant for viewing purposes only.
;
; DESCRIPTION:
;   This file contains shared equates (symbolic constants) used across all
;   EdAsm assembler modules including the Editor, Assembler, Linker, and
;   Binder components. These equates define:
;   - ASCII control character codes
;   - ProDOS file types
;   - Apple ][ standard zero page locations
;   - EdAsm-specific zero page variables
;   - Memory addresses for code and buffers
;   - ProDOS 8 global page locations
;   - Hardware soft switch addresses
;   - Monitor ROM entry points
;   - Sweet-16 interpreter registers
;   - ProDOS MLI parameter offsets
;
; TARGET AUDIENCE:
;   Readers familiar with 6502/65C02 assembly but may need context about
;   ProDOS conventions, Apple ][ hardware, and EdAsm architecture.
;
; USAGE:
;   Include this file at the beginning of EdAsm module source files to
;   access common symbol definitions.
;
;==============================================================================

            CHR    ";"

;==============================================================================
; ASCII Control Character Keycodes
;==============================================================================
; Standard ASCII control characters (0x01-0x1F) used for keyboard input
; processing in the Editor. These map directly to Ctrl+key combinations
; where the user holds Ctrl while pressing the letter key.
;
; Examples:
;   CTRLA = Ctrl+A = 0x01  (typically move to start of line)
;   CTRLC = Ctrl+C = 0x03  (often used as cancel/break)
;   CTRLX = Ctrl+X = 0x18  (defined below as cancel operation)
;
;------------------------------------------------------------------------------
CTRLA       EQU    $01              ; Ctrl+A
CTRLB       EQU    $02              ; Ctrl+B
CTRLC       EQU    $03              ; Ctrl+C
CTRLD       EQU    $04              ; Ctrl+D
CTRLE       EQU    $05              ; Ctrl+E
CTRLF       EQU    $06              ; Ctrl+F
BEL         EQU    $07              ; Bell/beep character
BS          EQU    $08              ; Backspace
TAB         EQU    $09              ; Tab character
FF          EQU    $0C              ; Form feed
CR          EQU    $0D              ; Carriage return (Enter key)
CTRLN       EQU    $0E              ; Ctrl+N
CTRLO       EQU    $0F              ; Ctrl+O
CTRLQ       EQU    $11              ; Ctrl+Q
CTRLR       EQU    $12              ; Ctrl+R
CTRLS       EQU    $13              ; Ctrl+S
CTRLT       EQU    $14              ; Ctrl+T
CTRLU       EQU    $15              ; Ctrl+U
CTRLV       EQU    $16              ; Ctrl+V
CTRLW       EQU    $17              ; Ctrl+W
CTRLX       EQU    $18              ; Ctrl+X - Cancel current operation
ESCAPE      EQU    $1B              ; Escape key
SPACE       EQU    $20              ; Space character
UNDERSCORE  EQU    $5F              ; Underscore character '_'
DEL         EQU    $7F              ; Delete key

;==============================================================================
; ProDOS File Types
;==============================================================================
; ProDOS uses a single-byte file type code to identify the kind of data
; stored in a file. These are the primary file types used by EdAsm:
;
; - TXT: Text files (readable ASCII)
; - BIN: Binary files (machine code, data)
; - DIR: Directory/folder
; - REL: Relocatable object files (used by Linker)
; - SYS: System files (bootable/executable ProDOS programs)
;
; These codes appear in ProDOS file info blocks and directory entries.
;------------------------------------------------------------------------------
TXTtype     EQU    $04              ; Text file type
BINtype     EQU    $06              ; Binary file type
DIRtype     EQU    $0D              ; Directory type (also $0F)
RELtype     EQU    $FE              ; Relocatable file type (for linking)
SYStype     EQU    $FF              ; System file type (executable)

;==============================================================================
; Apple ][ Standard Zero Page Locations
;==============================================================================
; The Apple ][ reserves certain zero page ($00-$FF) locations for system use.
; Zero page is special on the 6502 because it enables faster, shorter
; instructions compared to absolute addressing.
;
; These locations are part of the Apple ][ ROM Monitor and BASIC conventions:
; - WNDWDTH, CH, CV: Text screen positioning
; - BASL: Base address of current text line (screen memory)
; - InvFlg: Controls inverse video mode
; - CSWL/KSWL: Character output/input hook vectors
; - A1, A2, A4: General-purpose pointer variables
;------------------------------------------------------------------------------
WNDWDTH     EQU    $21              ; Text window width (usually 40 or 80)
CH          EQU    $24              ; Cursor horizontal position (column)
CV          EQU    $25              ; Cursor vertical position (row)
BASL        EQU    $28              ; Base address pointer for current line (2 bytes)
InvFlg      EQU    $32              ; Inverse video flag (FF=inverse, 00=normal)
Prompt      EQU    $33              ; Prompt character
CSWL        EQU    $36              ; Character output hook (CSW = Character Out Switch)
                                    ; Points to routine that handles COUT (2 bytes)
KSWL        EQU    $38              ; Character input hook (KSW = Keyboard Switch)
                                    ; Points to routine that handles keyboard input (2 bytes)
A1          EQU    $3C              ; General-purpose pointer 1 (2 bytes)
A2          EQU    $3E              ; General-purpose pointer 2 (2 bytes)
A4          EQU    $42              ; General-purpose pointer 4 (2 bytes)

;==============================================================================
; EdAsm Zero Page Variables
;==============================================================================
; These zero page locations are used by EdAsm's modules (Editor, Assembler,
; Linker). Unlike the Apple ][ standard locations above, these are specific
; to EdAsm's operation.
;
; IMPORTANT: Some locations serve dual purposes depending on which module
; is currently active. For example:
; - $0A is LoMem for system but TxtBgn (text buffer start) for Editor
; - $0C is HiMem normally but not used by EDASM.ASM module
;
; The Editor uses Sweet-16 pseudo-registers (R5-R7) which are aliased to
; these zero page locations.
;------------------------------------------------------------------------------
LoMem       EQU    $0A              ; Low memory boundary (=$0801) (2 bytes)
TxtBgn      EQU    $0A              ; Text buffer beginning (same as LoMem/Reg5) (2 bytes)
TxtEnd      EQU    $0E              ; Text buffer end (Reg7) (2 bytes)
HiMem       EQU    $0C              ; High memory boundary (=$9900) (2 bytes)
                                    ; Note: Not used by EDASM.ASM module
StackP      EQU    $49              ; Saved hardware stack pointer
VideoSlt    EQU    $50              ; Video slot number (=$Cs where s=slot 1-3)
                                    ; Used if 80-column video card is present
FileType    EQU    $51              ; Current file type being processed
ExecMode    EQU    $53              ; Execution mode flag
PtrMode     EQU    $54              ; Printer mode: $80=ON, $00=OFF
TabChar     EQU    $5F              ; Tab character (set by Editor)
PrColumn    EQU    $61              ; Current printer column position
UserTabT    EQU    $68              ; User-defined tab table ($68-$71, 10 bytes)
PrintF      EQU    $73              ; Print flag: -1=Print command, 0=List command
StackP2     EQU    $73              ; Secondary stack pointer save (on fatal error)
                                    ; Note: Same address as PrintF, different context
SwapMode    EQU    $74              ; Split-buffer mode: 0=normal, 1=buf1, 2=buf2
CaseMode    EQU    $75              ; Case mode: controls uppercase/lowercase handling
CmdDelim    EQU    $78              ; Command delimiter/separator character
TruncF      EQU    $79              ; Truncate comments flag: $FF=truncate

;==============================================================================
; Memory Address Constants
;==============================================================================
; Fixed memory addresses used by EdAsm components:
;
; $2000: Default load and execution address for SYS (system) files
; $8900: Load address for the Editor module
; $A900-$AD00: 1KB I/O buffers for ProDOS MLI (Machine Language Interface)
;              ProDOS requires user-supplied buffers for file operations
;------------------------------------------------------------------------------
X2000       EQU    $2000            ; Load & execute address for SYS files
LoadAdrEd   EQU    $8900            ; Load address for Editor module

;==============================================================================
; ProDOS I/O Buffers
;==============================================================================
; ProDOS 8 MLI (Machine Language Interface) requires the caller to provide
; 1024-byte buffers for file I/O operations. These buffers are used for
; reading and writing file data, directory entries, etc.
;
; EdAsm reserves two 1KB buffers in high memory for this purpose.
;------------------------------------------------------------------------------
XA900       EQU    $A900            ; First 1KB I/O buffer for ProDOS
XAD00       EQU    $AD00            ; Second 1KB I/O buffer for ProDOS

;==============================================================================
; EdAsm Global Page
;==============================================================================
; EdAsm uses a dedicated page of memory ($BD00-$BEFF) to pass parameters
; between its modules (Editor, Assembler, Linker, Binder).
;
; The EdAsm Interpreter (EI) must remain resident at all times to facilitate
; communication between these modules. This global page contains:
; - General-purpose 128-byte buffers
; - Current pathname buffer
; - Device control strings (for 80-column cards)
; - Tab table
; - Date/time storage
; - Directory path for EdAsm itself
; - Error message routine pointer
;------------------------------------------------------------------------------
XBD00       EQU    $BD00            ; General-purpose 128-byte buffer (1st half)
XBD80       EQU    $BD80            ; General-purpose 128-byte buffer (2nd half)
XBE00       EQU    $BE00            ; Current pathname buffer ($BE00-$BE3F, 64 bytes)
DevCtlS     EQU    $BE40            ; Device control strings ($BE40-$BE61)
                                    ; Initialized to $C3 if 80-column card present
TabTable    EQU    $BE60            ; Default tab table ($BE60-$BE62, 3 bytes)
DateTime    EQU    $BE64            ; Date and time storage ($BE64-$BE73, 16 bytes)
EdAsmDir    EQU    $BE79            ; Pathname where EdAsm lives
PrtError    EQU    $BEFC            ; EdAsm Interpreter error message routine

;==============================================================================
; Apple ][ Memory Locations
;==============================================================================
; Standard Apple ][ memory areas outside of zero page:
;
; $0100-$01FF: Hardware stack (6502 stack grows downward from $01FF)
; $0200-$027F: Input buffer (keyboard input line)
; $0280-$02FF: Text buffer 2 (secondary buffer)
; $03F2-$03FF: System vectors and flags
;
; These locations are part of the Apple ][ architecture and are documented
; in the Apple ][ Reference Manual.
;------------------------------------------------------------------------------
Stack       EQU    $0100            ; Hardware stack page (6502 stack, $0100-$01FF)
InBuf       EQU    $0200            ; Input buffer for keyboard input (128 bytes)
TxBuf2      EQU    $0280            ; Text buffer 2 (secondary, 128 bytes)
SOFTEV      EQU    $03F2            ; Soft entry vector (RESET vector) (3 bytes)
PWREDUP     EQU    $03F4            ; Power-up byte (indicates cold vs warm start)
USRADR      EQU    $03F8            ; User vector for Ctrl-Y (3 bytes)

;==============================================================================
; ProDOS 8 Global Page
;==============================================================================
; ProDOS 8 reserves the page at $BF00-$BFFF for system global variables.
; Application programs can read these to query system state but should not
; modify them directly.
;
; Key locations:
; - PRODOS8: MLI (Machine Language Interface) entry point at $BF00
; - LASTDEV: Last accessed device (useful for defaulting to current volume)
; - BitMap: Memory bitmap showing which pages are allocated
; - P8DATE/P8TIME: Current date and time in ProDOS format
; - MACHID: Machine identification byte (distinguishes //e, //c, IIgs, etc.)
; - SLTBYT: Slot ROM presence bitmap (which slots have ROMs)
;------------------------------------------------------------------------------
PRODOS8     EQU    $BF00            ; ProDOS 8 MLI entry point
                                    ; Call with JSR PRODOS8 after setting up params
LASTDEV     EQU    $BF30            ; Last device accessed (unit number)
BitMap      EQU    $BF58            ; System memory bitmap (shows allocated pages)
P8DATE      EQU    $BF90            ; ProDOS date (2 bytes, packed format)
P8TIME      EQU    $BF92            ; ProDOS time (2 bytes, packed format)
MACHID      EQU    $BF98            ; Machine ID byte (identifies Apple ][ model)
SLTBYT      EQU    $BF99            ; Slot byte (ROM presence bitmap for slots 1-7)
CMDADR      EQU    $BF9C            ; Last MLI call return address (2 bytes)
MINIVERS    EQU    $BFFC            ; Minimum ProDOS version required
IVERSION    EQU    $BFFD            ; Current ProDOS version number

;==============================================================================
; Hardware Soft Switches
;==============================================================================
; The Apple ][ uses memory-mapped I/O for hardware control. Reading or writing
; to specific addresses in the $C000-$CFFF range triggers hardware actions.
; These are called "soft switches."
;
; Reading these addresses often returns the switch state in bit 7 ($80).
; Some switches are "strobed" (just accessing them triggers the action).
;
; Key categories:
; - Keyboard: KBD (read key), KBDSTROBE (clear keyboard latch)
; - Video: CLR80VID (disable 80-column mode)
; - Buttons: BUTN2, BUTN3 (game controller/paddle buttons)
; - Language Card: Control ROM/RAM banking and read/write permissions
; - Expansion: Slot ROM entry points
;------------------------------------------------------------------------------
KBD         EQU    $C000            ; Keyboard data (bit 7=1 if key pressed)
                                    ; Bits 0-6 contain the ASCII code
CLR80VID    EQU    $C00C            ; Clear 80-column video mode
KBDSTROBE   EQU    $C010            ; Clear keyboard strobe (acknowledge key read)
BUTN3       EQU    $C060            ; Button 3 status (bit 7)
BUTN2       EQU    $C063            ; Button 2 status (bit 7)

;------------------------------------------------------------------------------
; Language Card Soft Switches (//e and later)
;------------------------------------------------------------------------------
; The Language Card provides 16KB of RAM that can replace ROM in the
; $D000-$FFFF range. It has two 4KB banks that can be switched.
;
; Bank switching is complex: some switches require two successive reads
; to fully enable read/write. This is indicated by (RR) = "Read twice"
;
; $C080-$C083 control Bank 2 (the default bank)
; $C088-$C08B control Bank 1 (alternate bank)
;------------------------------------------------------------------------------
RDBANK2     EQU    $C080            ; Read RAM bank 2, write-protect (read-only)
ROMIN2      EQU    $C081            ; Read ROM, write RAM bank 2 (RR=read twice)
RDROM2      EQU    $C082            ; Read ROM, write-protect (no writes)
LCBANK2     EQU    $C083            ; Read/Write RAM bank 2 (RR=read twice)

;------------------------------------------------------------------------------
; Expansion Card Entry Points
;------------------------------------------------------------------------------
; Expansion cards (in slots 1-7) have ROM at $Cs00-$CsFF where s=slot number.
; The card ROM typically has entry points and identification bytes.
;------------------------------------------------------------------------------
BASICINT    EQU    $C300            ; BASIC interpreter entry (slot 3 convention)
XC30B       EQU    $C30B            ; Card identification byte location
XC30C       EQU    $C30C            ; Card identification byte location

;------------------------------------------------------------------------------
; High Memory
;------------------------------------------------------------------------------
XD000       EQU    $D000            ; Language Card Bank 2 start
                                    ; Used by SW16 or Assembler's Print Symbol Table
BASCLD      EQU    $E000            ; AppleSoft BASIC cold start entry point

;==============================================================================
; Apple ][ Monitor ROM Entry Points
;==============================================================================
; The Apple ][ Monitor ROM provides useful utility routines that can be
; called from user programs. These are stable entry points across Apple ][
; models (though some may behave differently on //e, //c, IIgs).
;
; Common routines:
; - COUT: Output a character (uses CSWL hook)
; - RDKEY: Read a key from keyboard (waits)
; - CROUT: Output carriage return (newline)
; - HOME: Clear screen and home cursor
; - GETLN: Get a line of input from user
;
; All these are documented in the Apple ][ Reference Manual.
;------------------------------------------------------------------------------
SWEET16     EQU    $F689            ; Sweet-16 interpreter entry point
                                    ; (Originally in Integer BASIC ROM on ][ and ][+)
PRNTAX      EQU    $F941            ; Print A register as hex
PRBLNK      EQU    $F948            ; Print a blank (space)
INIT        EQU    $FB2F            ; Initialize text screen
BELL1       EQU    $FBDD            ; Ring the bell (beep)
VTABZ       EQU    $FC24            ; Vertical tab (set cursor row)
HOME        EQU    $FC58            ; Clear screen and home cursor
CLREOL      EQU    $FC9C            ; Clear to end of line
WAIT        EQU    $FCA8            ; Wait for keypress
RDKEY       EQU    $FD0C            ; Read key (waits for keypress)
RDCHAR      EQU    $FD35            ; Read character with cursor
GETLN       EQU    $FD6A            ; Get input line with prompt
CROUT       EQU    $FD8E            ; Output carriage return (newline)
COUT        EQU    $FDED            ; Output character (uses CSW hook)
COUT1       EQU    $FDF0            ; Output character directly to screen (bypasses hook)
MOVE        EQU    $FE2C            ; Memory move routine
SETNORM     EQU    $FE84            ; Set normal output (to screen)
SETKBD      EQU    $FE89            ; Set keyboard input
SETVID      EQU    $FE93            ; Set video output
PRERR       EQU    $FF2D            ; Print error message
MON         EQU    $FF65            ; Enter monitor
MONZ        EQU    $FF69            ; Enter monitor (alternate entry)
IRQV        EQU    $FFFE            ; IRQ vector (2 bytes)

;==============================================================================
; Sweet-16 Pseudo-Registers (Zero Page Mapping)
;==============================================================================
; Sweet-16 is a 16-bit pseudo-machine interpreter created by Steve Wozniak.
; It provides 16 registers (R0-R15) that are actually stored in zero page
; as pairs of bytes.
;
; Each register is 2 bytes (16 bits):
; - Reg0 = $00-$01 (R0 doubles as accumulator)
; - Reg1 = $02-$03 (R1)
; - ...
; - Reg15 = $1E-$1F (R15 is the program counter)
;
; Special registers:
; - R0: Accumulator (for arithmetic operations)
; - R12: Subroutine return stack pointer
; - R13: Result of comparison instructions
; - R14: Status register (flags)
; - R15: Program counter (for Sweet-16 code)
;
; The Editor module uses Sweet-16 extensively for text manipulation.
;------------------------------------------------------------------------------
; Zero page byte offsets for Sweet-16 registers when using 6502 instructions
Reg0        EQU    $00              ; R0 - Accumulator (2 bytes: $00-$01)
Reg1        EQU    $02              ; R1 (2 bytes: $02-$03)
Reg2        EQU    $04              ; R2 (2 bytes: $04-$05)
Reg3        EQU    $06              ; R3 (2 bytes: $06-$07)
Reg4        EQU    $08              ; R4 (2 bytes: $08-$09)
Reg5        EQU    $0A              ; R5 - Text buffer start (2 bytes: $0A-$0B)
Reg6        EQU    $0C              ; R6 - High memory (2 bytes: $0C-$0D)
Reg7        EQU    $0E              ; R7 - Text buffer end (2 bytes: $0E-$0F)
Reg8        EQU    $10              ; R8 (2 bytes: $10-$11)
Reg9        EQU    $12              ; R9 (2 bytes: $12-$13)
Reg10       EQU    $14              ; R10 (2 bytes: $14-$15)
Reg11       EQU    $16              ; R11 (2 bytes: $16-$17)
Reg12       EQU    $18              ; R12 - Subroutine return stack pointer (2 bytes)
Reg13       EQU    $1A              ; R13 - Comparison result (2 bytes)
Reg14       EQU    $1C              ; R14 - Status register (2 bytes)
Reg15       EQU    $1E              ; R15 - Program counter (2 bytes)

;------------------------------------------------------------------------------
; Sweet-16 Register Constants (for Sweet-16 instructions)
;------------------------------------------------------------------------------
; These are the register numbers used in Sweet-16 opcodes.
; For EdAsm (non-Merlin), these need to be defined.
; Merlin assemblers have these pre-defined.
;------------------------------------------------------------------------------
R0          EQU    0                ; Register 0 (Accumulator)
R1          EQU    1                ; Register 1
R2          EQU    2                ; Register 2
R3          EQU    3                ; Register 3
R4          EQU    4                ; Register 4
R5          EQU    5                ; Register 5 (Text start)
R6          EQU    6                ; Register 6 (High memory)
R7          EQU    7                ; Register 7 (Text end)
R8          EQU    8                ; Register 8
R9          EQU    9                ; Register 9
R10         EQU    10               ; Register 10
R11         EQU    11               ; Register 11
R12         EQU    12               ; Register 12 (Return stack pointer)
R13         EQU    13               ; Register 13 (Comparison result)
R14         EQU    14               ; Register 14 (Status register)
R15         EQU    15               ; Register 15 (Program counter)

;==============================================================================
; ProDOS MLI Parameter Offsets
;==============================================================================
; When calling ProDOS MLI (Machine Language Interface) routines, you pass
; a parameter block. Each MLI call has a specific parameter block structure.
;
; These equates define the byte offsets into parameter blocks:
; - Offset 0 is always the parameter count (how many parameters follow)
; - Subsequent bytes contain the actual parameters
;
; Example: OPEN call parameter block:
;   Byte 0: c.pCnt = 3 (parameter count)
;   Byte 1-2: c.path = pointer to pathname
;   Byte 3-4: c.bufAdr = pointer to I/O buffer
;   Byte 5: c.refNum = returned reference number
;
; These offsets are based on ProDOS Technical Reference Manual.
; Different MLI calls use different parameters, so the same offset
; may have different meanings (e.g., c.refNum and c.devNum both use offset 1).
;------------------------------------------------------------------------------
c.pCnt      EQU    $0               ; Parameter count (how many params follow)
c.devNum    EQU    $1               ; Device number (1 byte)
c.refNum    EQU    $1               ; File reference number (1 byte)
c.intNum    EQU    $1               ; Interrupt number (1 byte)
c.path      EQU    $1               ; Pathname pointer (2 bytes: offset 1-2)
c.isNewl    EQU    $2               ; Newline enable mask (1 byte)
c.dataBuf   EQU    $2               ; Data buffer address (2 bytes: offset 2-3)
c.bufAdr    EQU    $2               ; Buffer address (2 bytes: offset 2-3)
c.intAdr    EQU    $2               ; Interrupt address (2 bytes: offset 2-3)
c.mark      EQU    $2               ; File position mark (3 bytes: offset 2-4)
c.eof       EQU    $2               ; End-of-file position (3 bytes: offset 2-4)
c.attr      EQU    $3               ; File attributes (flags, 1 byte)
c.newl      EQU    $3               ; Newline character (1 byte)
c.bufPtr    EQU    $3               ; Buffer pointer (2 bytes: offset 3-4)
c.newPath   EQU    $3               ; New pathname pointer (2 bytes: offset 3-4)
c.fileId    EQU    $4               ; File ID (1 byte)
c.reqCnt    EQU    $4               ; Requested byte count (2 bytes: offset 4-5)
c.blkNum    EQU    $4               ; Block number (2 bytes: offset 4-5)
c.outRef    EQU    $5               ; Output reference number (1 byte)
c.auxId     EQU    $5               ; Auxiliary type ID (2 bytes: offset 5-6)
c.transCnt  EQU    $6               ; Transferred byte count (2 bytes: offset 6-7)
c.fKind     EQU    $7               ; File kind/type (1 byte)
c.date      EQU    $8               ; Date (2 bytes: offset 8-9)
c.outBlk    EQU    $8               ; Output block count (2 bytes: offset 8-9)
c.time      EQU    $a               ; Time (2 bytes: offset 10-11)
c.modDate   EQU    $a               ; Modification date (2 bytes: offset 10-11)
c.modTime   EQU    $c               ; Modification time (2 bytes: offset 12-13)
c.creDate   EQU    $e               ; Creation date (2 bytes: offset 14-15)
c.creTime   EQU    $10              ; Creation time (2 bytes: offset 16-17)

;==============================================================================
; End of COMMONEQUS.S
;==============================================================================
