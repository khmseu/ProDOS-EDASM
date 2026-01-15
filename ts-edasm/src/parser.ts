import { Lexer } from "./lexer.js";
import {
  ParseResult,
  Statement,
  Token,
  Expression,
  AddressingMode,
  SourcePosition,
} from "./types.js";

// Parser for EDASM assembly language with left-to-right expression evaluation
export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;

  constructor(private readonly source: string) {}

  parse(): ParseResult {
    const lexer = new Lexer(this.source);
    this.tokens = lexer.tokenize();
    this.current = 0;

    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      // Skip empty lines
      if (this.check("eol")) {
        this.advance();
        continue;
      }

      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }

      // Consume EOL if present
      if (this.check("eol")) {
        this.advance();
      }
    }

    return { statements, tokens: this.tokens };
  }

  private parseStatement(): Statement | null {
    const startPos = this.currentToken().pos;
    const statementTokens: Token[] = [];
    let label: string | undefined;
    let opcode: string | undefined;
    let directive: string | undefined;
    let operand: Expression | null = null;
    let comment: string | undefined;
    let addressing: AddressingMode | undefined;

    // Parse label (if at start of line)
    if (this.check("label") && !this.checkPrevious("operator")) {
      const labelToken = this.advance();
      statementTokens.push(labelToken);
      label = labelToken.lexeme;

      // Optional colon after label
      if (this.check("colon")) {
        statementTokens.push(this.advance());
      }
    }

    // Parse opcode or directive
    if (this.check("opcode")) {
      const opcodeToken = this.advance();
      statementTokens.push(opcodeToken);
      opcode = opcodeToken.lexeme.toUpperCase();
    } else if (this.check("directive")) {
      const directiveToken = this.advance();
      statementTokens.push(directiveToken);
      directive = directiveToken.lexeme.toUpperCase();
    }

    // Parse operand and determine addressing mode
    if (
      opcode &&
      !this.check("eol") &&
      !this.check("comment") &&
      !this.check("eof")
    ) {
      const result = this.parseOperandWithAddressing();
      operand = result.operand;
      addressing = result.addressing;
      statementTokens.push(...result.tokens);
    } else if (
      directive &&
      !this.check("eol") &&
      !this.check("comment") &&
      !this.check("eof")
    ) {
      const result = this.parseExpression();
      operand = result.expr;
      statementTokens.push(...result.tokens);
    }

    // Parse comment
    if (this.check("comment")) {
      const commentToken = this.advance();
      statementTokens.push(commentToken);
      comment = commentToken.lexeme;
    }

    // If we have no label, opcode, or directive, this might be a comment-only line
    if (!label && !opcode && !directive && comment) {
      return {
        comment,
        tokens: statementTokens,
        pos: startPos,
      };
    }

    // Return null for empty statements
    if (!label && !opcode && !directive) {
      return null;
    }

    return {
      label,
      opcode,
      directive,
      operand,
      comment,
      addressing,
      tokens: statementTokens,
      pos: startPos,
    };
  }

  private parseOperandWithAddressing(): {
    operand: Expression | null;
    addressing: AddressingMode;
    tokens: Token[];
  } {
    const tokens: Token[] = [];
    let addressing: AddressingMode = "absolute";
    let operand: Expression | null = null;

    // Check for immediate mode (#)
    if (this.check("operator") && this.currentToken().lexeme === "#") {
      tokens.push(this.advance());
      addressing = "immediate";

      // Check for low/high byte extraction
      if (
        this.check("operator") &&
        (this.currentToken().lexeme === "<" ||
          this.currentToken().lexeme === ">")
      ) {
        const op = this.currentToken().lexeme;
        tokens.push(this.advance());
        const result = this.parseExpression();
        operand = result.expr;
        tokens.push(...result.tokens);
        addressing = op === "<" ? "immediate-low" : "immediate-high";
      } else {
        const result = this.parseExpression();
        operand = result.expr;
        tokens.push(...result.tokens);
      }
    }
    // Check for indirect addressing
    else if (this.check("lparen")) {
      tokens.push(this.advance());
      const result = this.parseExpression();
      operand = result.expr;
      tokens.push(...result.tokens);

      if (this.check("rparen")) {
        tokens.push(this.advance());
        // Check for indexed indirect (,Y)
        if (this.check("comma")) {
          tokens.push(this.advance());
          if (this.check("label")) {
            const token = this.currentToken();
            if (token && token.lexeme.toUpperCase() === "Y") {
              tokens.push(this.advance());
              addressing = "indirect-y";
            }
          }
        } else {
          addressing = "jmp-indirect";
        }
      }
    }
    // Regular expression with possible indexing
    else {
      const result = this.parseExpression();
      operand = result.expr;
      tokens.push(...result.tokens);

      // Check for indexed addressing (,X or ,Y)
      if (this.check("comma")) {
        tokens.push(this.advance());
        if (this.check("label")) {
          const token = this.currentToken();
          if (token) {
            const index = token.lexeme.toUpperCase();
            tokens.push(this.advance());
            if (index === "X") {
              addressing = "absolute-x";
            } else if (index === "Y") {
              addressing = "absolute-y";
            }
          }
        }
      }
    }

    // Check for accumulator mode (A)
    if (
      operand &&
      operand.kind === "symbol" &&
      operand.name.toUpperCase() === "A"
    ) {
      addressing = "accumulator";
    }

    return { operand, addressing, tokens };
  }

  private parseExpression(): { expr: Expression | null; tokens: Token[] } {
    const tokens: Token[] = [];
    let expr = this.parsePrimary(tokens);

    // Left-to-right evaluation (EDASM style)
    while (
      this.check("operator") &&
      this.isBinaryOp(this.currentToken().lexeme)
    ) {
      const opToken = this.advance();
      tokens.push(opToken);
      const right = this.parsePrimary(tokens);

      if (expr && right) {
        const pos = expr.pos;
        expr = {
          kind: "binary",
          op: opToken.lexeme as "+" | "-" | "*" | "/",
          left: expr,
          right: right,
          pos,
        };
      }
    }

    return { expr, tokens };
  }

  private parsePrimary(tokens: Token[]): Expression | null {
    // Number literal
    if (this.check("number")) {
      const token = this.advance();
      tokens.push(token);
      const value = this.parseNumericLiteral(token.lexeme);
      return { kind: "literal", value, pos: token.pos };
    }

    // Symbol reference
    if (this.check("label")) {
      const token = this.advance();
      tokens.push(token);
      return { kind: "symbol", name: token.lexeme, pos: token.pos };
    }

    // String (treat as literal or bytes)
    if (this.check("string")) {
      const token = this.advance();
      tokens.push(token);
      // For now, treat strings as symbols (will be handled in assembler)
      return { kind: "symbol", name: token.lexeme, pos: token.pos };
    }

    // Unary operators (< for low byte, > for high byte)
    if (
      this.check("operator") &&
      (this.currentToken().lexeme === "<" || this.currentToken().lexeme === ">")
    ) {
      const opToken = this.advance();
      tokens.push(opToken);
      const operand = this.parsePrimary(tokens);
      if (operand) {
        // For now, treat as symbol (will be evaluated in assembler)
        return operand;
      }
    }

    // Parenthesized expression
    if (this.check("lparen")) {
      tokens.push(this.advance());
      const result = this.parseExpression();
      tokens.push(...result.tokens);
      if (this.check("rparen")) {
        tokens.push(this.advance());
      }
      return result.expr;
    }

    return null;
  }

  private parseNumericLiteral(lexeme: string): number {
    // Hex: $xxxx or 0xXXXX
    if (lexeme.startsWith("$")) {
      return parseInt(lexeme.substring(1), 16);
    }
    if (lexeme.startsWith("0x") || lexeme.startsWith("0X")) {
      return parseInt(lexeme.substring(2), 16);
    }

    // Binary: %xxxxxxxx or 0bxxxxxxxx
    if (lexeme.startsWith("%")) {
      return parseInt(lexeme.substring(1), 2);
    }
    if (lexeme.startsWith("0b") || lexeme.startsWith("0B")) {
      return parseInt(lexeme.substring(2), 2);
    }

    // Decimal
    return parseInt(lexeme, 10);
  }

  private isBinaryOp(lexeme: string): boolean {
    return ["+", "-", "*", "/", "&", "|", "^"].includes(lexeme);
  }

  private check(kind: string): boolean {
    if (this.isAtEnd()) return false;
    return this.currentToken().kind === kind;
  }

  private checkPrevious(kind: string): boolean {
    if (this.current === 0) return false;
    return this.tokens[this.current - 1].kind === kind;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.currentToken().kind === "eof";
  }

  private currentToken(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
