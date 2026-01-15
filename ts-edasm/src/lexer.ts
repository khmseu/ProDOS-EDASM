import { Token } from "./types.js";

// Skeleton lexical analyzer; the real implementation will mirror EDASM's fielded source format.
export class Lexer {
  constructor(private readonly source: string) {}

  tokenize(): Token[] {
    // TODO: implement tokenization for labels/opcodes/directives/comments per EDASM rules.
    return [];
  }
}
