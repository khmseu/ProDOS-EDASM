export interface SourcePosition {
  line: number;
  column: number;
}

export type TokenKind =
  | "label"
  | "opcode"
  | "directive"
  | "number"
  | "string"
  | "operator"
  | "comma"
  | "colon"
  | "lparen"
  | "rparen"
  | "comment"
  | "eol"
  | "eof";

export interface Token {
  kind: TokenKind;
  lexeme: string;
  pos: SourcePosition;
}

export type AddressingMode =
  | "implied"
  | "accumulator"
  | "immediate"
  | "immediate-low"
  | "immediate-high"
  | "zeropage"
  | "zeropage-x"
  | "zeropage-y"
  | "absolute"
  | "absolute-x"
  | "absolute-y"
  | "indirect"
  | "indirect-x"
  | "indirect-y"
  | "jmp-indirect";

export interface ExpressionLiteral {
  kind: "literal";
  value: number;
  pos: SourcePosition;
}

export interface ExpressionSymbol {
  kind: "symbol";
  name: string;
  pos: SourcePosition;
}

export interface ExpressionBinary {
  kind: "binary";
  op: "+" | "-" | "*" | "/";
  left: Expression;
  right: Expression;
  pos: SourcePosition;
}

export type Expression =
  | ExpressionLiteral
  | ExpressionSymbol
  | ExpressionBinary;

export interface Statement {
  label?: string;
  opcode?: string;
  directive?: string;
  operand?: Expression | null;
  comment?: string;
  addressing?: AddressingMode;
  tokens: Token[];
  pos: SourcePosition;
}

export interface ParseResult {
  statements: Statement[];
  tokens: Token[];
}

export interface AssemblerOptions {
  listing?: boolean;
  relocatable?: boolean;
  msbDefaultOn?: boolean;
  basePath?: string; // Base path for resolving INCLUDE directives
}

// Relocation entry for RLD (Relocation Dictionary)
export interface RelocationEntry {
  address: number; // Address that needs relocation
  size: number; // Size of value (1 or 2 bytes)
}

// Macro definition
export interface MacroDefinition {
  name: string; // Macro name (from label on MACRO line)
  body: Statement[]; // Statements in macro body
  pos: SourcePosition; // Position of MACRO directive
}

export interface AssemblyArtifact {
  bytes: Uint8Array;
  listing?: string;
  symbols: Record<string, number>;
  errors?: string[]; // Optional error messages from assembly
  relocatable?: boolean; // True if assembled in REL mode
  rld?: RelocationEntry[]; // Relocation Dictionary for linker
  externals?: string[]; // External symbol names (from EXTRN directive)
  entries?: string[]; // Entry point names (from ENTRY directive)
}
