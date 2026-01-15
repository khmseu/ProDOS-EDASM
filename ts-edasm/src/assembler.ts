import { Parser } from "./parser.js";
import {
  AssemblerOptions,
  AssemblyArtifact,
  Statement,
  Expression,
} from "./types.js";
import { getOpcode, isDirective } from "./opcodes.js";

// Two-pass assembler for EDASM compatibility
export function assemble(
  source: string,
  options: AssemblerOptions = {},
): AssemblyArtifact {
  const parser = new Parser(source);
  const { statements } = parser.parse();

  const assembler = new Assembler(statements, options);
  return assembler.assemble();
}

class Assembler {
  private symbols: Record<string, number> = {};
  private pc: number = 0; // Program counter
  private bytes: number[] = [];
  private errors: string[] = [];
  private conditionalStack: boolean[] = []; // Stack for tracking conditional assembly state
  private assemblyEnabled: boolean = true; // Whether we're currently assembling

  constructor(
    private readonly statements: Statement[],
    private readonly options: AssemblerOptions,
  ) {}

  assemble(): AssemblyArtifact {
    // Pass 1: Build symbol table
    this.passOne();

    // Pass 2: Generate code
    this.passTwo();

    const listing = this.options.listing ? this.generateListing() : undefined;

    return {
      bytes: new Uint8Array(this.bytes),
      listing,
      symbols: this.symbols,
    };
  }

  private passOne(): void {
    this.pc = 0;
    this.conditionalStack = [];
    this.assemblyEnabled = true;

    for (const stmt of this.statements) {
      // Handle conditional directives first
      if (stmt.directive) {
        const directive = stmt.directive.toUpperCase();
        if (this.isConditionalDirective(directive)) {
          this.processConditionalDirective(directive, stmt, true);
          continue;
        }
      }

      // Only process labels and statements if assembly is enabled
      if (this.assemblyEnabled) {
        // Define label
        if (stmt.label) {
          this.symbols[stmt.label] = this.pc;
        }

        // Process directives that affect PC
        if (stmt.directive) {
          this.processDirectivePassOne(stmt);
        } else if (stmt.opcode) {
          // Calculate instruction size
          const size = this.calculateInstructionSize(stmt);
          this.pc += size;
        }
      }
    }
  }

  private passTwo(): void {
    this.pc = 0;
    this.bytes = [];
    this.conditionalStack = [];
    this.assemblyEnabled = true;

    for (const stmt of this.statements) {
      // Handle conditional directives first
      if (stmt.directive) {
        const directive = stmt.directive.toUpperCase();
        if (this.isConditionalDirective(directive)) {
          this.processConditionalDirective(directive, stmt, false);
          continue;
        }
      }

      // Only emit code if assembly is enabled
      if (this.assemblyEnabled) {
        if (stmt.directive) {
          this.processDirectivePassTwo(stmt);
        } else if (stmt.opcode) {
          this.emitInstruction(stmt);
        }
      }
    }
  }

  private processDirectivePassOne(stmt: Statement): void {
    const directive = stmt.directive!.toUpperCase();

    switch (directive) {
      case "ORG":
        if (stmt.operand) {
          this.pc = this.evaluateExpression(stmt.operand);
        }
        break;

      case "EQU":
        if (stmt.label && stmt.operand) {
          this.symbols[stmt.label] = this.evaluateExpression(stmt.operand);
        }
        break;

      case "DA":
      case "DW":
      case "DDB":
        this.pc += 2;
        break;

      case "DB":
      case "DFB":
        this.pc += 1;
        break;
      
      case "STR":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          // String with length prefix (1 byte length + string bytes)
          const str = stmt.operand.name;
          const len = str.length - 2; // Remove quotes
          this.pc += 1 + len; // Length byte + string bytes
        }
        break;

      case "DS":
        if (stmt.operand) {
          const count = this.evaluateExpression(stmt.operand);
          this.pc += count;
        }
        break;

      case "ASC":
      case "DCI":
      case "INV":
      case "FLS":
      case "REV":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          // String length (remove quotes)
          const str = stmt.operand.name;
          const len = str.length - 2; // Remove quotes
          this.pc += len;
        }
        break;

      case "HEX":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          // Hex bytes (2 chars per byte)
          const hex = stmt.operand.name.replace(/\s/g, "");
          this.pc += Math.floor(hex.length / 2);
        }
        break;
    }
  }

  private processDirectivePassTwo(stmt: Statement): void {
    const directive = stmt.directive!.toUpperCase();

    switch (directive) {
      case "ORG":
        if (stmt.operand) {
          this.pc = this.evaluateExpression(stmt.operand);
        }
        break;

      case "EQU":
        // Already handled in pass 1
        break;

      case "DA":
      case "DW":
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.emitWord(value);
        }
        break;
      
      case "DDB":
        // Double byte: high byte first, then low byte (reverse of DW)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.emitByte((value >> 8) & 0xff); // High byte first
          this.emitByte(value & 0xff); // Low byte second
        }
        break;

      case "DB":
      case "DFB":
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.emitByte(value);
        }
        break;

      case "DS":
        if (stmt.operand) {
          const count = this.evaluateExpression(stmt.operand);
          for (let i = 0; i < count; i++) {
            this.emitByte(0);
          }
        }
        break;

      case "ASC":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          this.emitString(stmt.operand.name, false);
        }
        break;

      case "DCI":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          this.emitString(stmt.operand.name, true);
        }
        break;
      
      case "STR":
        // String with length prefix: emit length byte followed by string
        if (stmt.operand && stmt.operand.kind === "symbol") {
          const content = stmt.operand.name.substring(1, stmt.operand.name.length - 1);
          this.emitByte(content.length); // Length prefix
          this.emitString(stmt.operand.name, false); // String bytes
        }
        break;

      case "HEX":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          this.emitHexString(stmt.operand.name);
        }
        break;
    }
  }

  private emitInstruction(stmt: Statement): void {
    const opcodeInfo = getOpcode(stmt.opcode!);
    if (!opcodeInfo) {
      this.errors.push(`Unknown opcode: ${stmt.opcode}`);
      return;
    }

    let addressing = stmt.addressing || "implied";

    // Branch instructions use immediate mode but with relative addressing
    const isBranch = [
      "BCC",
      "BCS",
      "BEQ",
      "BMI",
      "BNE",
      "BPL",
      "BVC",
      "BVS",
    ].includes(stmt.opcode!.toUpperCase());

    // For branch instructions, convert absolute/zeropage to immediate
    if (isBranch && (addressing === "absolute" || addressing === "zeropage")) {
      addressing = "immediate";
    }

    // Determine if we should use zeropage addressing
    if (
      stmt.operand &&
      !isBranch &&
      (addressing === "absolute" ||
        addressing === "absolute-x" ||
        addressing === "absolute-y")
    ) {
      const value = this.evaluateExpression(stmt.operand);
      if (value >= 0 && value < 256) {
        // Convert to zeropage addressing if available
        if (addressing === "absolute" && opcodeInfo.modes["zeropage"]) {
          addressing = "zeropage";
        } else if (
          addressing === "absolute-x" &&
          opcodeInfo.modes["zeropage-x"]
        ) {
          addressing = "zeropage-x";
        } else if (
          addressing === "absolute-y" &&
          opcodeInfo.modes["zeropage-y"]
        ) {
          addressing = "zeropage-y";
        }
      }
    }

    const opcode = opcodeInfo.modes[addressing];
    if (opcode === undefined) {
      this.errors.push(
        `Invalid addressing mode ${addressing} for opcode ${stmt.opcode}`,
      );
      return;
    }

    this.emitByte(opcode);

    // Emit operand bytes
    if (stmt.operand) {
      const value = this.evaluateExpression(stmt.operand);

      if (isBranch) {
        // Branch instructions use relative addressing
        // Calculate offset from next instruction (current PC already points past opcode,
        // and PC + 1 will point past the operand byte we're about to emit)
        const offset = value - (this.pc + 1);
        // Ensure offset is in range -128 to +127
        if (offset < -128 || offset > 127) {
          this.errors.push(`Branch offset out of range: ${offset}`);
        }
        this.emitByte(offset & 0xff);
      } else {
        switch (addressing) {
          case "immediate":
          case "immediate-low":
          case "immediate-high":
          case "zeropage":
          case "zeropage-x":
          case "zeropage-y":
            if (addressing === "immediate-low") {
              this.emitByte(value & 0xff);
            } else if (addressing === "immediate-high") {
              this.emitByte((value >> 8) & 0xff);
            } else {
              this.emitByte(value & 0xff);
            }
            break;

          case "absolute":
          case "absolute-x":
          case "absolute-y":
          case "jmp-indirect":
          case "indirect-y":
            this.emitWord(value);
            break;
        }
      }
    }
  }

  private calculateInstructionSize(stmt: Statement): number {
    const opcodeInfo = getOpcode(stmt.opcode!);
    if (!opcodeInfo) return 1;

    const addressing = stmt.addressing || "implied";

    // Branch instructions are always 2 bytes (opcode + relative offset)
    const isBranch = [
      "BCC",
      "BCS",
      "BEQ",
      "BMI",
      "BNE",
      "BPL",
      "BVC",
      "BVS",
    ].includes(stmt.opcode!.toUpperCase());
    if (isBranch) {
      return 2;
    }

    switch (addressing) {
      case "implied":
      case "accumulator":
        return 1;

      case "immediate":
      case "immediate-low":
      case "immediate-high":
      case "zeropage":
      case "zeropage-x":
      case "zeropage-y":
        return 2;

      case "absolute":
      case "absolute-x":
      case "absolute-y":
      case "jmp-indirect":
      case "indirect-y":
        return 3;

      default:
        return 1;
    }
  }

  private evaluateExpression(expr: Expression): number {
    switch (expr.kind) {
      case "literal":
        return expr.value;

      case "symbol":
        // Handle string literals (remove quotes)
        if (expr.name.startsWith('"') || expr.name.startsWith("'")) {
          return expr.name.charCodeAt(1); // First character
        }
        const value = this.symbols[expr.name];
        if (value === undefined) {
          this.errors.push(`Undefined symbol: ${expr.name}`);
          return 0;
        }
        return value;

      case "binary":
        const left = this.evaluateExpression(expr.left);
        const right = this.evaluateExpression(expr.right);
        switch (expr.op) {
          case "+":
            return (left + right) & 0xffff;
          case "-":
            return (left - right) & 0xffff;
          case "*":
            return (left * right) & 0xffff;
          case "/":
            return Math.floor(left / right) & 0xffff;
          default:
            return 0;
        }
    }
  }

  private emitByte(value: number): void {
    this.bytes.push(value & 0xff);
    this.pc++;
  }

  private emitWord(value: number): void {
    this.emitByte(value & 0xff); // Low byte
    this.emitByte((value >> 8) & 0xff); // High byte
  }

  private emitString(str: string, invertLast: boolean): void {
    // Remove quotes
    const content = str.substring(1, str.length - 1);

    for (let i = 0; i < content.length; i++) {
      let byte = content.charCodeAt(i);
      // DCI: invert (set high bit) on last character
      if (invertLast && i === content.length - 1) {
        byte |= 0x80;
      }
      this.emitByte(byte);
    }
  }

  private emitHexString(hex: string): void {
    // Remove whitespace
    const clean = hex.replace(/\s/g, "");
    for (let i = 0; i < clean.length; i += 2) {
      const byte = parseInt(clean.substring(i, i + 2), 16);
      this.emitByte(byte);
    }
  }

  private isConditionalDirective(directive: string): boolean {
    return ["DO", "IF", "IFNE", "IFEQ", "IFGT", "IFGE", "IFLT", "IFLE", "ELSE", "FIN"].includes(directive);
  }

  private processConditionalDirective(directive: string, stmt: Statement, isPassOne: boolean): void {
    switch (directive) {
      case "DO":
      case "IF":
        // DO/IF: Start conditional block, evaluate expression
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (value !== 0);
        }
        break;

      case "IFNE":
        // If not equal (to zero)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (value !== 0);
        }
        break;

      case "IFEQ":
        // If equal (to zero)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (value === 0);
        }
        break;

      case "IFGT":
        // If greater than zero
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (value > 0);
        }
        break;

      case "IFGE":
        // If greater or equal to zero
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (value >= 0);
        }
        break;

      case "IFLT":
        // If less than zero (treating as signed 16-bit)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          const signed = value > 32767 ? value - 65536 : value;
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (signed < 0);
        }
        break;

      case "IFLE":
        // If less or equal to zero (treating as signed 16-bit)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          const signed = value > 32767 ? value - 65536 : value;
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (signed <= 0);
        }
        break;

      case "ELSE":
        // ELSE: Toggle assembly state within current conditional block
        if (this.conditionalStack.length > 0) {
          const parentState = this.conditionalStack[this.conditionalStack.length - 1];
          // Toggle: if we were assembling, stop; if we weren't, check if parent allows
          this.assemblyEnabled = parentState && !this.assemblyEnabled;
        }
        break;

      case "FIN":
        // FIN: End conditional block, restore previous state
        if (this.conditionalStack.length > 0) {
          this.assemblyEnabled = this.conditionalStack.pop()!;
        }
        break;
    }
  }

  private generateListing(): string {
    let listing = "";
    let pc = 0;

    for (const stmt of this.statements) {
      const line = `${pc.toString(16).padStart(4, "0").toUpperCase()}  `;
      listing += line;

      if (stmt.label) {
        listing += `${stmt.label}: `;
      }
      if (stmt.opcode) {
        listing += `${stmt.opcode} `;
      }
      if (stmt.directive) {
        listing += `${stmt.directive} `;
      }
      if (stmt.comment) {
        listing += stmt.comment;
      }

      listing += "\n";

      // Update PC
      if (stmt.directive) {
        // Simplified - just track ORG
        if (stmt.directive.toUpperCase() === "ORG" && stmt.operand) {
          pc = this.evaluateExpression(stmt.operand);
        }
      } else if (stmt.opcode) {
        pc += this.calculateInstructionSize(stmt);
      }
    }

    return listing;
  }
}
