import { AddressingMode } from "./types.js";

// 6502 opcode definitions with their supported addressing modes and bytecode values
export interface OpcodeInfo {
  mnemonic: string;
  modes: Partial<Record<AddressingMode, number>>;
}

// 6502 instruction set - opcodes with their addressing modes and machine code values
export const OPCODES: Record<string, OpcodeInfo> = {
  ADC: {
    mnemonic: "ADC",
    modes: {
      immediate: 0x69,
      zeropage: 0x65,
      "zeropage-x": 0x75,
      absolute: 0x6d,
      "absolute-x": 0x7d,
      "absolute-y": 0x79,
      "indirect-x": 0x61,
      "indirect-y": 0x71,
    },
  },
  AND: {
    mnemonic: "AND",
    modes: {
      immediate: 0x29,
      zeropage: 0x25,
      "zeropage-x": 0x35,
      absolute: 0x2d,
      "absolute-x": 0x3d,
      "absolute-y": 0x39,
      "indirect-x": 0x21,
      "indirect-y": 0x31,
    },
  },
  ASL: {
    mnemonic: "ASL",
    modes: {
      accumulator: 0x0a,
      zeropage: 0x06,
      "zeropage-x": 0x16,
      absolute: 0x0e,
      "absolute-x": 0x1e,
    },
  },
  BCC: { mnemonic: "BCC", modes: { immediate: 0x90 } },
  BCS: { mnemonic: "BCS", modes: { immediate: 0xb0 } },
  BEQ: { mnemonic: "BEQ", modes: { immediate: 0xf0 } },
  BIT: {
    mnemonic: "BIT",
    modes: { zeropage: 0x24, absolute: 0x2c },
  },
  BMI: { mnemonic: "BMI", modes: { immediate: 0x30 } },
  BNE: { mnemonic: "BNE", modes: { immediate: 0xd0 } },
  BPL: { mnemonic: "BPL", modes: { immediate: 0x10 } },
  BRK: { mnemonic: "BRK", modes: { implied: 0x00 } },
  BVC: { mnemonic: "BVC", modes: { immediate: 0x50 } },
  BVS: { mnemonic: "BVS", modes: { immediate: 0x70 } },
  CLC: { mnemonic: "CLC", modes: { implied: 0x18 } },
  CLD: { mnemonic: "CLD", modes: { implied: 0xd8 } },
  CLI: { mnemonic: "CLI", modes: { implied: 0x58 } },
  CLV: { mnemonic: "CLV", modes: { implied: 0xb8 } },
  CMP: {
    mnemonic: "CMP",
    modes: {
      immediate: 0xc9,
      zeropage: 0xc5,
      "zeropage-x": 0xd5,
      absolute: 0xcd,
      "absolute-x": 0xdd,
      "absolute-y": 0xd9,
      "indirect-x": 0xc1,
      "indirect-y": 0xd1,
    },
  },
  CPX: {
    mnemonic: "CPX",
    modes: { immediate: 0xe0, zeropage: 0xe4, absolute: 0xec },
  },
  CPY: {
    mnemonic: "CPY",
    modes: { immediate: 0xc0, zeropage: 0xc4, absolute: 0xcc },
  },
  DEC: {
    mnemonic: "DEC",
    modes: {
      zeropage: 0xc6,
      "zeropage-x": 0xd6,
      absolute: 0xce,
      "absolute-x": 0xde,
    },
  },
  DEX: { mnemonic: "DEX", modes: { implied: 0xca } },
  DEY: { mnemonic: "DEY", modes: { implied: 0x88 } },
  EOR: {
    mnemonic: "EOR",
    modes: {
      immediate: 0x49,
      zeropage: 0x45,
      "zeropage-x": 0x55,
      absolute: 0x4d,
      "absolute-x": 0x5d,
      "absolute-y": 0x59,
      "indirect-x": 0x41,
      "indirect-y": 0x51,
    },
  },
  INC: {
    mnemonic: "INC",
    modes: {
      zeropage: 0xe6,
      "zeropage-x": 0xf6,
      absolute: 0xee,
      "absolute-x": 0xfe,
    },
  },
  INX: { mnemonic: "INX", modes: { implied: 0xe8 } },
  INY: { mnemonic: "INY", modes: { implied: 0xc8 } },
  JMP: {
    mnemonic: "JMP",
    modes: { absolute: 0x4c, "jmp-indirect": 0x6c },
  },
  JSR: { mnemonic: "JSR", modes: { absolute: 0x20 } },
  LDA: {
    mnemonic: "LDA",
    modes: {
      immediate: 0xa9,
      zeropage: 0xa5,
      "zeropage-x": 0xb5,
      absolute: 0xad,
      "absolute-x": 0xbd,
      "absolute-y": 0xb9,
      "indirect-x": 0xa1,
      "indirect-y": 0xb1,
    },
  },
  LDX: {
    mnemonic: "LDX",
    modes: {
      immediate: 0xa2,
      zeropage: 0xa6,
      "zeropage-y": 0xb6,
      absolute: 0xae,
      "absolute-y": 0xbe,
    },
  },
  LDY: {
    mnemonic: "LDY",
    modes: {
      immediate: 0xa0,
      zeropage: 0xa4,
      "zeropage-x": 0xb4,
      absolute: 0xac,
      "absolute-x": 0xbc,
    },
  },
  LSR: {
    mnemonic: "LSR",
    modes: {
      accumulator: 0x4a,
      zeropage: 0x46,
      "zeropage-x": 0x56,
      absolute: 0x4e,
      "absolute-x": 0x5e,
    },
  },
  NOP: { mnemonic: "NOP", modes: { implied: 0xea } },
  ORA: {
    mnemonic: "ORA",
    modes: {
      immediate: 0x09,
      zeropage: 0x05,
      "zeropage-x": 0x15,
      absolute: 0x0d,
      "absolute-x": 0x1d,
      "absolute-y": 0x19,
      "indirect-x": 0x01,
      "indirect-y": 0x11,
    },
  },
  PHA: { mnemonic: "PHA", modes: { implied: 0x48 } },
  PHP: { mnemonic: "PHP", modes: { implied: 0x08 } },
  PLA: { mnemonic: "PLA", modes: { implied: 0x68 } },
  PLP: { mnemonic: "PLP", modes: { implied: 0x28 } },
  ROL: {
    mnemonic: "ROL",
    modes: {
      accumulator: 0x2a,
      zeropage: 0x26,
      "zeropage-x": 0x36,
      absolute: 0x2e,
      "absolute-x": 0x3e,
    },
  },
  ROR: {
    mnemonic: "ROR",
    modes: {
      accumulator: 0x6a,
      zeropage: 0x66,
      "zeropage-x": 0x76,
      absolute: 0x6e,
      "absolute-x": 0x7e,
    },
  },
  RTI: { mnemonic: "RTI", modes: { implied: 0x40 } },
  RTS: { mnemonic: "RTS", modes: { implied: 0x60 } },
  SBC: {
    mnemonic: "SBC",
    modes: {
      immediate: 0xe9,
      zeropage: 0xe5,
      "zeropage-x": 0xf5,
      absolute: 0xed,
      "absolute-x": 0xfd,
      "absolute-y": 0xf9,
      "indirect-x": 0xe1,
      "indirect-y": 0xf1,
    },
  },
  SEC: { mnemonic: "SEC", modes: { implied: 0x38 } },
  SED: { mnemonic: "SED", modes: { implied: 0xf8 } },
  SEI: { mnemonic: "SEI", modes: { implied: 0x78 } },
  STA: {
    mnemonic: "STA",
    modes: {
      zeropage: 0x85,
      "zeropage-x": 0x95,
      absolute: 0x8d,
      "absolute-x": 0x9d,
      "absolute-y": 0x99,
      "indirect-x": 0x81,
      "indirect-y": 0x91,
    },
  },
  STX: {
    mnemonic: "STX",
    modes: { zeropage: 0x86, "zeropage-y": 0x96, absolute: 0x8e },
  },
  STY: {
    mnemonic: "STY",
    modes: { zeropage: 0x84, "zeropage-x": 0x94, absolute: 0x8c },
  },
  TAX: { mnemonic: "TAX", modes: { implied: 0xaa } },
  TAY: { mnemonic: "TAY", modes: { implied: 0xa8 } },
  TSX: { mnemonic: "TSX", modes: { implied: 0xba } },
  TXA: { mnemonic: "TXA", modes: { implied: 0x8a } },
  TXS: { mnemonic: "TXS", modes: { implied: 0x9a } },
  TYA: { mnemonic: "TYA", modes: { implied: 0x98 } },
};

// EDASM assembler directives
export const DIRECTIVES = new Set([
  // Origin and constants
  "ORG", // Set origin/address
  "EQU", // Define constant
  "OBJ", // Object file name/creation
  
  // Data directives
  "DA", // Define address (2 bytes)
  "DW", // Define word (2 bytes)
  "DB", // Define byte (1 byte)
  "DFB", // Define byte (1 byte)
  "DDB", // Define double byte (word, high byte first)
  "ASC", // ASCII string
  "DCI", // Dextral Character Inverted (last char high bit set)
  "STR", // String with length prefix
  "INV", // Inverse video string
  "FLS", // Flash string
  "REV", // Reverse string
  "HEX", // Hex bytes
  "DS", // Define storage (reserve bytes)
  
  // Structure definition
  "DSECT", // Start data section
  "DEND", // End data section
  
  // MSB control
  "MSB", // Control MSB for ASCII output
  
  // Relocatable/linking
  "REL", // Relocatable mode
  "EXTRN", // External reference
  "ENTRY", // Entry point
  "EXT", // External reference (alternate)
  "ENT", // Entry point (alternate)
  "EXTN", // External reference (alternate)
  
  // Conditional assembly
  "DO", // Conditional do
  "ELSE", // Conditional else
  "FIN", // End conditional
  "IF", // Conditional assembly (alternate)
  "IFNE", // If not equal
  "IFEQ", // If equal
  "IFGT", // If greater than
  "IFGE", // If greater or equal
  "IFLT", // If less than
  "IFLE", // If less or equal
  
  // Listing control
  "LST", // Listing control
  "LIST", // Listing control (alternate)
  "LSTDO", // Listing output control
  "PAGE", // Page eject
  "SKP", // Skip lines
  "REP", // Repeat character
  "CHR", // Set repeat character
  "SBTL", // Subtitle
  "TTL", // Title
  "PAG", // Page eject (alternate)
  
  // File operations
  "CHN", // Chain source file
  "INCLUDE", // Include file
  "MACLIB", // Macro library file
  "PAUSE", // Manual disk swap
  "SAV", // Save output file
  "PUT", // Include file (alternate)
  "USE", // Use macro library (alternate)
  "DSK", // Disk image directive
  
  // Buffer sizing
  "IBUFSIZ", // Input buffer size
  "SBUFSIZ", // Source buffer size
  
  // Sweet-16 and CPU control
  "SW16", // Sweet-16 interpreter address
  "SET", // Sweet-16 register assignment
  "X6502", // 65C02 opcode control
  
  // Timestamp and identification
  "DATE", // Embed date
  "TIME", // Embed time
  "IDNUM", // Identification number
  
  // Error control
  "FAIL", // Conditional error reporting
  
  // Macros
  "MAC", // Define macro
  "EOM", // End of macro
  "PMC", // Print macro
  ">>>", // Macro call (alternate form)
  
  // Other
  "CHK", // Checksum
  "USR", // User routine
]);

export function isOpcode(name: string): boolean {
  return name.toUpperCase() in OPCODES;
}

export function isDirective(name: string): boolean {
  return DIRECTIVES.has(name.toUpperCase());
}

export function getOpcode(name: string): OpcodeInfo | undefined {
  return OPCODES[name.toUpperCase()];
}
