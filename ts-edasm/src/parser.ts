import { Lexer } from "./lexer.js";
import { ParseResult, Statement } from "./types.js";

// Basic parser skeleton; evaluates expressions left-to-right like EDASM.
export class Parser {
  constructor(private readonly source: string) {}

  parse(): ParseResult {
    const lexer = new Lexer(this.source);
    const tokens = lexer.tokenize();
    const statements: Statement[] = [];

    // TODO: build statements and expression trees from tokens.
    return { statements, tokens };
  }
}
