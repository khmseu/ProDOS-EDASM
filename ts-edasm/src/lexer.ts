import { Token, TokenKind, SourcePosition } from "./types.js";
import { isOpcode, isDirective } from "./opcodes.js";

// EDASM lexer - handles fielded source format:
// - Column 1-9: Label field (must start in column 1)
// - Column 10+: Operation field (opcode/directive)
// - Operand field follows operation
// - Comment starts with ; or * in column 1
export class Lexer {
  private pos: number = 0;
  private line: number = 1;
  private column: number = 1;
  private readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push(this.makeToken("eof", ""));
    return tokens;
  }

  private nextToken(): Token | null {
    this.skipWhitespaceInLine();

    if (this.isAtEnd()) {
      return null;
    }

    const ch = this.peek();

    // End of line
    if (ch === "\n" || ch === "\r") {
      const token = this.makeToken("eol", ch);
      this.advance();
      if (ch === "\r" && this.peek() === "\n") {
        this.advance();
      }
      this.line++;
      this.column = 1;
      return token;
    }

    // Comment (either ; anywhere or * in column 1)
    if (ch === ";" || (ch === "*" && this.column === 1)) {
      return this.scanComment();
    }

    // Label (starts in column 1)
    if (this.column === 1 && this.isLabelStart(ch)) {
      return this.scanLabel();
    }

    // Number
    if (this.isDigit(ch) || (ch === "$" && this.isHexDigit(this.peekNext()))) {
      return this.scanNumber();
    }

    // String
    if (ch === '"' || ch === "'") {
      return this.scanString();
    }

    // Identifier (opcode, directive, or symbol)
    if (this.isAlpha(ch) || ch === ".") {
      return this.scanIdentifier();
    }

    // Operators and punctuation
    switch (ch) {
      case "+":
      case "-":
      case "*":
      case "/":
      case "<":
      case ">":
      case "&":
      case "|":
      case "^":
        this.advance();
        return this.makeToken("operator", ch);
      case ",":
        this.advance();
        return this.makeToken("comma", ch);
      case ":":
        this.advance();
        return this.makeToken("colon", ch);
      case "(":
        this.advance();
        return this.makeToken("lparen", ch);
      case ")":
        this.advance();
        return this.makeToken("rparen", ch);
      case "#":
        this.advance();
        return this.makeToken("operator", ch);
    }

    // Unknown character - skip it
    this.advance();
    return null;
  }

  private scanLabel(): Token {
    const start = this.pos;
    const startPos = this.currentPos();

    // Labels can contain letters, digits, dots, and underscores
    while (this.isLabelChar(this.peek())) {
      this.advance();
    }

    const lexeme = this.source.substring(start, this.pos);
    return { kind: "label", lexeme, pos: startPos };
  }

  private scanIdentifier(): Token {
    const start = this.pos;
    const startPos = this.currentPos();

    while (this.isAlphaNumeric(this.peek()) || this.peek() === ".") {
      this.advance();
    }

    const lexeme = this.source.substring(start, this.pos);
    const upper = lexeme.toUpperCase();

    let kind: TokenKind;
    if (isOpcode(upper)) {
      kind = "opcode";
    } else if (isDirective(upper)) {
      kind = "directive";
    } else {
      kind = "label"; // Symbol reference
    }

    return { kind, lexeme, pos: startPos };
  }

  private scanNumber(): Token {
    const start = this.pos;
    const startPos = this.currentPos();

    // Hex number ($xxxx or 0xXXXX)
    if (this.peek() === "$") {
      this.advance();
      while (this.isHexDigit(this.peek())) {
        this.advance();
      }
    } else if (this.peek() === "0" && this.peekNext() === "x") {
      this.advance(); // 0
      this.advance(); // x
      while (this.isHexDigit(this.peek())) {
        this.advance();
      }
    } else if (this.peek() === "%" || this.peek() === "0" && this.peekNext() === "b") {
      // Binary number (%xxxxxxxx or 0bxxxxxxxx)
      if (this.peek() === "%") {
        this.advance();
      } else {
        this.advance(); // 0
        this.advance(); // b
      }
      while (this.peek() === "0" || this.peek() === "1") {
        this.advance();
      }
    } else {
      // Decimal number
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const lexeme = this.source.substring(start, this.pos);
    return { kind: "number", lexeme, pos: startPos };
  }

  private scanString(): Token {
    const start = this.pos;
    const startPos = this.currentPos();
    const quote = this.peek();
    this.advance(); // opening quote

    while (!this.isAtEnd() && this.peek() !== quote && this.peek() !== "\n") {
      this.advance();
    }

    if (this.peek() === quote) {
      this.advance(); // closing quote
    }

    const lexeme = this.source.substring(start, this.pos);
    return { kind: "string", lexeme, pos: startPos };
  }

  private scanComment(): Token {
    const start = this.pos;
    const startPos = this.currentPos();

    // Read until end of line
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      this.advance();
    }

    const lexeme = this.source.substring(start, this.pos);
    return { kind: "comment", lexeme, pos: startPos };
  }

  private skipWhitespaceInLine(): void {
    while (this.peek() === " " || this.peek() === "\t") {
      this.advance();
    }
  }

  private isLabelStart(ch: string): boolean {
    return this.isAlpha(ch) || ch === "_" || ch === ".";
  }

  private isLabelChar(ch: string): boolean {
    return this.isAlphaNumeric(ch) || ch === "_" || ch === ".";
  }

  private isAlpha(ch: string): boolean {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z");
  }

  private isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  }

  private isHexDigit(ch: string): boolean {
    return this.isDigit(ch) || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
  }

  private isAlphaNumeric(ch: string): boolean {
    return this.isAlpha(ch) || this.isDigit(ch);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.pos];
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.source.length) return "\0";
    return this.source[this.pos + 1];
  }

  private advance(): string {
    const ch = this.source[this.pos++];
    this.column++;
    return ch;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private currentPos(): SourcePosition {
    return { line: this.line, column: this.column };
  }

  private makeToken(kind: TokenKind, lexeme: string): Token {
    return { kind, lexeme, pos: this.currentPos() };
  }
}
