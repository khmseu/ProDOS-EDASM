import { Parser } from "./parser.js";
import {
  AssemblerOptions,
  AssemblyArtifact,
  Statement,
  Expression,
  MacroDefinition,
} from "./types.js";
import { getOpcode, isDirective } from "./opcodes.js";
import * as fs from "fs";
import * as path from "path";

// Two-pass assembler for EDASM compatibility
export function assemble(
  source: string,
  options: AssemblerOptions = {},
): AssemblyArtifact {
  // Pre-process macros at the text level before parsing
  const { sourceWithoutMacros, macros } = extractAndExpandMacros(source);
  
  const parser = new Parser(sourceWithoutMacros);
  const { statements } = parser.parse();

  // Expand INCLUDE directives
  const basePath = options.basePath || '.';
  const includeErrors: string[] = [];
  const expandedStatements = expandIncludes(statements, basePath, new Set(), includeErrors);

  const assembler = new Assembler(expandedStatements, options);
  const result = assembler.assemble();
  
  // Add include errors to the result if any
  if (includeErrors.length > 0) {
    result.errors = [...(result.errors || []), ...includeErrors];
  }
  
  return result;
}

// Extract macro definitions and expand macro calls at the text level
function extractAndExpandMacros(source: string): { sourceWithoutMacros: string; macros: Map<string, MacroDefinition> } {
  const lines = source.split('\n');
  const macros = new Map<string, MacroDefinition>();
  const outputLines: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line starts a macro definition
    // Format: LABEL   MACRO
    const macroMatch = line.match(/^(\w+)\s+(MACRO|MAC)\s*(?:;.*)?$/i);
    
    if (macroMatch) {
      const macroName = macroMatch[1].toUpperCase();
      const bodyLines: string[] = [];
      const startLine = i;
      
      // Skip the MACRO line
      i++;
      
      // Collect lines until ENDM
      while (i < lines.length) {
        const bodyLine = lines[i];
        const bodyTrimmed = bodyLine.trim().toUpperCase();
        
        if (bodyTrimmed === 'ENDM' || bodyTrimmed === 'EOM' || bodyTrimmed.startsWith('ENDM ') || bodyTrimmed.startsWith('EOM ')) {
          // Found end of macro
          i++; // Skip ENDM line
          break;
        }
        
        bodyLines.push(bodyLine);
        i++;
      }
      
      // Store the macro
      macros.set(macroName, {
        name: macroName,
        bodyLines,
        pos: { line: startLine + 1, column: 1 },
      });
    } else {
      // Check if this line is a macro call
      // Format: [label]   MACRONAME [args...]
      const callMatch = line.match(/^(\w+)?\s+(\w+)(.*)$/);
      
      if (callMatch) {
        const label = callMatch[1] || '';
        const possibleMacro = callMatch[2].toUpperCase();
        const argsText = callMatch[3];
        
        if (macros.has(possibleMacro)) {
          // This is a macro call!
          const macro = macros.get(possibleMacro)!;
          
          // Parse arguments (comma-separated)
          const args: string[] = [];
          if (argsText.trim()) {
            // Simple argument parsing - split by comma
            const argsPart = argsText.split(';')[0]; // Remove comments
            args.push(...argsPart.split(',').map(a => a.trim()).filter(a => a));
          }
          
          // Expand the macro body
          for (const bodyLine of macro.bodyLines) {
            let expandedLine = bodyLine;
            
            // Substitute &0 (first argument, used for labels)
            if (args.length > 0) {
              expandedLine = expandedLine.replace(/&0/g, args[0]);
            }
            
            // Substitute &X (parameter count)
            expandedLine = expandedLine.replace(/&X/gi, args.length.toString());
            
            // Substitute &1-&9 (arguments, 1-indexed)
            for (let paramNum = 1; paramNum <= 9; paramNum++) {
              const pattern = new RegExp(`&${paramNum}`, 'g');
              const value = paramNum <= args.length ? args[paramNum - 1] : '';
              expandedLine = expandedLine.replace(pattern, value);
            }
            
            outputLines.push(expandedLine);
          }
          
          i++;
          continue;
        }
      }
      
      // Not a macro definition or call, keep the line
      outputLines.push(line);
      i++;
    }
  }
  
  return {
    sourceWithoutMacros: outputLines.join('\n'),
    macros,
  };
}

// Recursively expand INCLUDE directives
function expandIncludes(
  statements: Statement[],
  basePath: string,
  visitedFiles: Set<string>,
  errors: string[],
): Statement[] {
  const expanded: Statement[] = [];

  for (const stmt of statements) {
    if (stmt.directive?.toUpperCase() === "INCLUDE") {
      // Get the filename from the operand
      if (stmt.operand && stmt.operand.kind === "symbol") {
        let filename = stmt.operand.name;
        
        // Remove quotes if present
        if ((filename.startsWith('"') && filename.endsWith('"')) ||
            (filename.startsWith("'") && filename.endsWith("'"))) {
          filename = filename.slice(1, -1);
        }

        // Resolve path relative to base path
        const fullPath = path.isAbsolute(filename) 
          ? filename 
          : path.resolve(basePath, filename);

        // Check for circular includes
        if (visitedFiles.has(fullPath)) {
          errors.push(`Circular include detected: ${fullPath}`);
          continue;
        }

        // Read and parse the included file
        try {
          const includedSource = fs.readFileSync(fullPath, "utf-8");
          const includedParser = new Parser(includedSource);
          const { statements: includedStatements } = includedParser.parse();

          // Mark this file as visited
          const newVisited = new Set(visitedFiles);
          newVisited.add(fullPath);

          // Recursively expand includes in the included file
          const includedBasePath = path.dirname(fullPath);
          const expandedIncluded = expandIncludes(includedStatements, includedBasePath, newVisited, errors);

          // Add the expanded statements
          expanded.push(...expandedIncluded);
        } catch (error) {
          // Include failed - record error for debugging
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to include file ${fullPath}: ${errorMsg}`);
        }
      }
    } else {
      // Not an INCLUDE directive, keep the statement
      expanded.push(stmt);
    }
  }

  return expanded;
}

// Information about each line for listing generation
interface ListingLine {
  pc: number;
  bytes: number[];
  sourceLine: string;
  lineNumber: number;
  suppressed: boolean; // True if in false conditional
  expressionResult?: number; // Result of expression evaluation for display
}

class Assembler {
  private symbols: Record<string, number> = {};
  private pc: number = 0; // Program counter
  private bytes: number[] = [];
  private errors: string[] = [];
  private conditionalStack: boolean[] = []; // Stack for tracking conditional assembly state
  private assemblyEnabled: boolean = true; // Whether we're currently assembling
  private msbOn: boolean = false; // MSB setting for ASCII output (default OFF for compatibility)
  private inDsect: boolean = false; // Whether we're inside a DSECT block
  private listingLines: ListingLine[] = []; // Track listing information
  private listingEnabled: boolean = true; // Whether listing is enabled (LST ON/OFF)
  private currentLineNumber: number = 0; // Current source line number
  private repeatChar: string = "*"; // Character to use for REP directive
  
  // Relocatable output support
  private relocatableMode: boolean = false; // REL directive sets this
  private relocationDictionary: Array<{address: number; size: number}> = []; // RLD entries
  private externalSymbols: string[] = []; // EXTRN directive populates this
  private entryPoints: string[] = []; // ENTRY directive populates this
  
  // Performance: Pre-computed Sets for O(1) lookups instead of O(n) array.includes()
  private static readonly BRANCH_OPCODES = new Set([
    "BCC", "BCS", "BEQ", "BMI", "BNE", "BPL", "BVC", "BVS"
  ]);
  
  private static readonly CONDITIONAL_DIRECTIVES = new Set([
    "DO", "IF", "IFNE", "IFEQ", "IFGT", "IFGE", "IFLT", "IFLE", "ELSE", "FIN"
  ]);

  constructor(
    private readonly statements: Statement[],
    private readonly options: AssemblerOptions,
  ) {
    // Initialize MSB from options if provided, default is OFF
    if (options.msbDefaultOn !== undefined) {
      this.msbOn = options.msbDefaultOn;
    }
  }

  assemble(): AssemblyArtifact {
    // Pass 1: Build symbol table
    this.passOne();

    // Pass 2: Generate code
    this.passTwo();

    const listing = this.options.listing ? this.generateListing() : undefined;

    const result: AssemblyArtifact = {
      bytes: new Uint8Array(this.bytes),
      listing,
      symbols: this.symbols,
      errors: this.errors.length > 0 ? this.errors : undefined,
    };
    
    // Add relocatable output information if in REL mode
    if (this.relocatableMode) {
      result.relocatable = true;
      result.rld = this.relocationDictionary;
      result.externals = this.externalSymbols.length > 0 ? this.externalSymbols : undefined;
      result.entries = this.entryPoints.length > 0 ? this.entryPoints : undefined;
    }
    
    return result;
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
    this.listingLines = [];
    this.currentLineNumber = 0;

    for (const stmt of this.statements) {
      this.currentLineNumber++;
      const startPC = this.pc;
      const startByteCount = this.bytes.length;

      // Handle conditional directives first
      if (stmt.directive) {
        const directive = stmt.directive.toUpperCase();
        if (this.isConditionalDirective(directive)) {
          this.processConditionalDirective(directive, stmt, false);
          // Add listing line for conditional directives
          this.addListingLine(stmt, startPC, startByteCount, !this.assemblyEnabled);
          continue;
        }
      }

      // Track whether this line is suppressed
      const suppressed = !this.assemblyEnabled;

      // Only emit code if assembly is enabled
      if (this.assemblyEnabled) {
        if (stmt.directive) {
          this.processDirectivePassTwo(stmt);
        } else if (stmt.opcode) {
          this.emitInstruction(stmt);
        }
      }
      
      // Add listing line after processing (captures bytes emitted)
      this.addListingLine(stmt, startPC, startByteCount, suppressed);
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
      
      case "REL":
        // Enable relocatable mode
        this.relocatableMode = true;
        break;
      
      case "EXTRN":
      case "EXT":
      case "EXTN":
        // Parse external symbol names from operand
        this.parseSymbolList(stmt.operand ?? null, this.externalSymbols, stmt);
        break;
      
      case "ENTRY":
      case "ENT":
        // Parse entry point names from operand
        this.parseSymbolList(stmt.operand ?? null, this.entryPoints, stmt);
        break;

      case "DA":
      case "DW":
      case "DDB":
        // These can have comma-separated values (2 bytes each)
        const wordValues = this.extractNumericValues(stmt);
        this.pc += (wordValues.length > 0 ? wordValues.length : 1) * 2;
        break;

      case "DB":
      case "DFB":
        // DB can have comma-separated values
        const dbValues = this.extractNumericValues(stmt);
        this.pc += dbValues.length > 0 ? dbValues.length : 1;
        break;
      
      case "STR":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          // String with length prefix (1 byte length + string bytes)
          const str = stmt.operand.name;
          const len = str.length - 2; // Remove quotes
          if (len > 255) {
            this.errors.push(`String too long for STR directive (max 255 characters): ${len} characters`);
          }
          this.pc += 1 + len; // Length byte + string bytes
        }
        break;

      case "DS":
        if (stmt.operand) {
          const count = this.evaluateExpression(stmt.operand);
          this.pc += count;
        }
        break;
      
      case "DSECT":
        // Start data section - defines structure without emitting bytes
        this.inDsect = true;
        break;
      
      case "DEND":
        // End data section
        this.inDsect = false;
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
        {
          const hexString = this.extractHexString(stmt);
          if (hexString) {
            // Hex bytes (2 chars per byte)
            const hex = hexString.replace(/\s/g, "");
            this.pc += Math.floor(hex.length / 2);
          }
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
      
      case "REL":
        // Enable relocatable mode (already set in pass 1)
        this.relocatableMode = true;
        break;
      
      case "EXTRN":
      case "EXT":
      case "EXTN":
        // External symbols already parsed in pass 1
        break;
      
      case "ENTRY":
      case "ENT":
        // Entry points already parsed in pass 1
        break;

      case "DA":
      case "DW":
        // DW can have comma-separated values
        {
          const dwValues = this.extractNumericValues(stmt);
          for (const value of dwValues) {
            // Track relocation if in REL mode (assuming symbolic reference)
            if (this.relocatableMode) {
              this.addRelocation(this.pc, 2);
            }
            this.emitWord(value);
          }
          // Fallback: if no values extracted (old single-value format), try evaluating operand
          if (dwValues.length === 0 && stmt.operand) {
            const value = this.evaluateExpression(stmt.operand);
            // Track relocation if in REL mode and operand contains symbol
            if (this.relocatableMode && this.expressionContainsSymbol(stmt.operand)) {
              this.addRelocation(this.pc, 2);
            }
            this.emitWord(value);
          }
        }
        break;
      
      case "DDB":
        // Double byte: high byte first, then low byte (reverse of DW)
        // DDB can have comma-separated values
        {
          const ddbValues = this.extractNumericValues(stmt);
          for (const value of ddbValues) {
            // Track relocation if in REL mode (assuming symbolic reference)
            if (this.relocatableMode) {
              this.addRelocation(this.pc, 2);
            }
            this.emitByte((value >> 8) & 0xff); // High byte first
            this.emitByte(value & 0xff); // Low byte second
          }
          // Fallback: if no values extracted (old single-value format), try evaluating operand
          if (ddbValues.length === 0 && stmt.operand) {
            const value = this.evaluateExpression(stmt.operand);
            // Track relocation if in REL mode and operand contains symbol
            if (this.relocatableMode && this.expressionContainsSymbol(stmt.operand)) {
              this.addRelocation(this.pc, 2);
            }
            this.emitByte((value >> 8) & 0xff); // High byte first
            this.emitByte(value & 0xff); // Low byte second
          }
        }
        break;

      case "DB":
      case "DFB":
        // DB can have comma-separated values
        const dbValues = this.extractNumericValues(stmt);
        for (const value of dbValues) {
          this.emitByte(value);
        }
        // Fallback: if no values extracted (old single-value format), try evaluating operand
        if (dbValues.length === 0 && stmt.operand) {
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
      
      case "DSECT":
        // Start data section - defines structure without emitting bytes
        this.inDsect = true;
        break;
      
      case "DEND":
        // End data section
        this.inDsect = false;
        break;

      case "ASC":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          this.emitString(stmt.operand.name, false, this.msbOn);
        }
        break;

      case "DCI":
        if (stmt.operand && stmt.operand.kind === "symbol") {
          this.emitString(stmt.operand.name, true, false);
        }
        break;
      
      case "STR":
        // String with length prefix: emit length byte followed by string
        if (stmt.operand && stmt.operand.kind === "symbol") {
          const content = stmt.operand.name.substring(1, stmt.operand.name.length - 1);
          if (content.length > 255) {
            this.errors.push(`String too long for STR directive (max 255 characters): ${content.length} characters`);
          }
          this.emitByte(content.length & 0xff); // Length prefix (truncate if > 255)
          this.emitString(stmt.operand.name, false, this.msbOn); // String bytes with MSB setting
        }
        break;
      
      case "MSB":
        // MSB directive: control high bit for ASCII output
        // MSB ON (or MSB with no operand) sets high bit
        // MSB OFF clears high bit
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          this.msbOn = value !== 0;
        } else {
          // No operand means ON
          this.msbOn = true;
        }
        break;

      case "HEX":
        {
          const hexString = this.extractHexString(stmt);
          if (hexString) {
            this.emitHexString(hexString);
          }
        }
        break;
      
      // Listing control directives
      case "LST":
      case "LSTDO":
        // LST ON/OFF or LSTDO: Control listing output
        this.listingEnabled = this.evaluateLstDirective(stmt);
        break;
      
      case "PAGE":
        // PAGE: Page eject - will be handled in listing generation
        // No code generation, just marker for listing
        break;
      
      case "SKP":
        // SKP: Skip lines - will be handled in listing generation
        // No code generation, just marker for listing
        break;
      
      case "REP":
        // REP: Repeat character - will be handled in listing generation
        // No code generation, just marker for listing
        break;
      
      case "CHR":
        // CHR: Set repeat character for REP directive
        this.processChrDirective(stmt);
        break;
      
      case "SBTL":
        // SBTL: Subtitle - will be handled in listing generation
        // No code generation, just marker for listing
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
    const isBranch = Assembler.BRANCH_OPCODES.has(stmt.opcode!.toUpperCase());

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
            // Track relocation if in REL mode and operand contains symbol
            if (this.relocatableMode && stmt.operand && this.expressionContainsSymbol(stmt.operand)) {
              this.addRelocation(this.pc, 2);
            }
            this.emitWord(value);
            break;
          
          case "indirect-x":
          case "indirect-y":
            this.emitByte(value);
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
    const isBranch = Assembler.BRANCH_OPCODES.has(stmt.opcode!.toUpperCase());
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
      case "indirect-x":
      case "indirect-y":
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
        // Handle program counter reference (*)
        if (expr.name === "*") {
          return this.pc;
        }
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
    // In DSECT mode, don't emit bytes but still increment PC
    if (!this.inDsect) {
      this.bytes.push(value & 0xff);
    }
    this.pc++;
  }

  private emitWord(value: number): void {
    this.emitByte(value & 0xff); // Low byte
    this.emitByte((value >> 8) & 0xff); // High byte
  }

  private emitString(str: string, invertLast: boolean, applyMSB: boolean = false): void {
    // Remove quotes
    const content = str.substring(1, str.length - 1);

    for (let i = 0; i < content.length; i++) {
      let byte = content.charCodeAt(i);
      
      // Apply MSB setting if requested (for ASC and STR directives)
      if (applyMSB) {
        byte |= 0x80;
      }
      
      // DCI: invert (set high bit) on last character
      // Note: DCI always sets high bit on last char, regardless of MSB setting
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
    return Assembler.CONDITIONAL_DIRECTIVES.has(directive);
  }
  
  private toSigned16(value: number): number {
    // Convert unsigned 16-bit value to signed 16-bit
    return value > 32767 ? value - 65536 : value;
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
          const signed = this.toSigned16(value);
          this.conditionalStack.push(this.assemblyEnabled);
          this.assemblyEnabled = this.assemblyEnabled && (signed < 0);
        }
        break;

      case "IFLE":
        // If less or equal to zero (treating as signed 16-bit)
        if (stmt.operand) {
          const value = this.evaluateExpression(stmt.operand);
          const signed = this.toSigned16(value);
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

  private evaluateLstDirective(stmt: Statement): boolean {
    // Helper method to evaluate LST/LSTDO directive operand
    // Returns true for ON, false for OFF
    if (stmt.operand) {
      if (stmt.operand.kind === "symbol") {
        const operandName = stmt.operand.name.toUpperCase();
        if (operandName === "ON") {
          return true;
        } else if (operandName === "OFF") {
          return false;
        }
        // Any other symbol defaults to OFF
        return false;
      } else {
        // Numeric value: 0 = OFF, non-zero = ON
        const value = this.evaluateExpression(stmt.operand);
        return value !== 0;
      }
    } else {
      // No operand means ON
      return true;
    }
  }

  private processChrDirective(stmt: Statement): void {
    // Helper method to process CHR directive and update repeatChar
    if (stmt.operand && stmt.operand.kind === "symbol") {
      // Extract the character from the symbol (should be a quoted character)
      let charStr = stmt.operand.name;
      if ((charStr.startsWith('"') && charStr.endsWith('"')) ||
          (charStr.startsWith("'") && charStr.endsWith("'"))) {
        charStr = charStr.slice(1, -1);
      }
      if (charStr.length > 0) {
        this.repeatChar = charStr[0];
      }
    } else if (stmt.operand && stmt.operand.kind === "literal") {
      // ASCII value of character
      const asciiValue = this.evaluateExpression(stmt.operand);
      this.repeatChar = String.fromCharCode(asciiValue);
    }
  }

  private extractHexString(stmt: Statement): string | null {
    // Helper method to extract hex string from HEX directive operand
    if (!stmt.operand) {
      return null;
    }

    if (stmt.operand.kind === "symbol") {
      return stmt.operand.name;
    } else if (stmt.operand.kind === "literal") {
      // For HEX directive, find the original token to get the raw string
      // This preserves the hex digits instead of converting from decimal
      const operandToken = stmt.tokens.find(t => t.kind === "number");
      if (operandToken) {
        return operandToken.lexeme;
      } else {
        // Fallback: convert literal back to hex string
        let hexString = stmt.operand.value.toString(16);
        // Pad to even length
        if (hexString.length % 2 !== 0) {
          hexString = "0" + hexString;
        }
        return hexString;
      }
    }

    return null;
  }

  private addListingLine(
    stmt: Statement,
    startPC: number,
    startByteCount: number,
    suppressed: boolean
  ): void {
    // Get the bytes emitted for this statement
    const bytes = this.bytes.slice(startByteCount);
    
    // Reconstruct the source line
    let sourceLine = "";
    if (stmt.label) {
      sourceLine += stmt.label;
    }
    if (stmt.opcode) {
      sourceLine += (sourceLine ? "  " : "") + stmt.opcode;
    }
    if (stmt.directive) {
      sourceLine += (sourceLine ? "  " : "") + stmt.directive;
    }
    if (stmt.comment) {
      sourceLine += " " + stmt.comment;
    }
    
    // Calculate expression result if there's an operand
    let expressionResult: number | undefined;
    if (stmt.operand && (stmt.directive?.toUpperCase() === "EQU" || stmt.opcode)) {
      try {
        expressionResult = this.evaluateExpression(stmt.operand);
      } catch {
        // Ignore evaluation errors for listing
      }
    }
    
    this.listingLines.push({
      pc: startPC,
      bytes,
      sourceLine,
      lineNumber: this.currentLineNumber,
      suppressed,
      expressionResult,
    });
  }

  private generateListing(): string {
    if (this.listingLines.length === 0) {
      return "";
    }

    let listing = "";
    let listingOutputEnabled = true; // Track LST ON/OFF state during listing generation

    for (let i = 0; i < this.listingLines.length; i++) {
      const line = this.listingLines[i];
      const stmt = this.statements[i];

      // Handle listing control directives
      if (stmt.directive) {
        const directive = stmt.directive.toUpperCase();
        
        // Handle LST ON/OFF directive
        if (directive === "LST" || directive === "LSTDO") {
          listingOutputEnabled = this.evaluateLstDirective(stmt);
        }
        
        // Handle CHR directive - set repeat character
        if (directive === "CHR") {
          this.processChrDirective(stmt);
          continue; // CHR doesn't produce listing output
        }
        
        // Handle PAGE directive - insert form feed
        if (directive === "PAGE") {
          listing += "\f";
          continue;
        }
        
        // Handle SKP directive - insert blank lines
        if (directive === "SKP") {
          if (stmt.operand) {
            const count = this.evaluateExpression(stmt.operand);
            for (let j = 0; j < count; j++) {
              listing += "\n";
            }
          }
          continue;
        }
        
        // Handle REP directive - insert repeated character line
        if (directive === "REP") {
          if (stmt.operand) {
            const count = this.evaluateExpression(stmt.operand);
            // Use the repeat character set by CHR directive (default is '*')
            listing += this.repeatChar.repeat(count) + "\n";
          }
          continue;
        }
        
        // Handle SBTL directive - insert subtitle line
        if (directive === "SBTL") {
          if (stmt.operand && stmt.operand.kind === "symbol") {
            // Remove quotes from subtitle
            let subtitle = stmt.operand.name;
            if ((subtitle.startsWith('"') && subtitle.endsWith('"')) ||
                (subtitle.startsWith("'") && subtitle.endsWith("'"))) {
              subtitle = subtitle.slice(1, -1);
            }
            listing += "\n" + subtitle + "\n\n";
          }
          continue;
        }
      }

      // Skip if listing is disabled
      if (!listingOutputEnabled) {
        continue;
      }

      // Format: PC:5  Code:12      ER:3 Line:5  Source
      // Example: 1000  A9 42           52     2  START   LDA #$42
      
      // PC field (5 chars, right-aligned)
      const pcStr = line.pc.toString(16).toUpperCase().padStart(4, "0");
      listing += pcStr.padEnd(5);
      listing += " ";
      
      // Code field (12 chars) - show up to 4 bytes on first line
      const codeBytes = line.bytes.slice(0, 4);
      const codeStr = codeBytes.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
      listing += codeStr.padEnd(12);
      listing += " ";
      
      // ER field (3 chars) - expression result or suppressed indicator
      if (line.suppressed) {
        listing += "S".padEnd(3);
      } else if (line.expressionResult !== undefined) {
        const erStr = line.expressionResult.toString(16).toUpperCase().padStart(2, "0");
        listing += erStr.padEnd(3);
      } else {
        listing += "   ";
      }
      listing += " ";
      
      // Line number field (5 chars, right-aligned)
      listing += line.lineNumber.toString().padStart(5);
      listing += "  ";
      
      // Source line
      listing += line.sourceLine;
      listing += "\n";
      
      // Handle continuation lines for >4 bytes
      if (line.bytes.length > 4) {
        for (let j = 4; j < line.bytes.length; j += 4) {
          const continuationBytes = line.bytes.slice(j, j + 4);
          const continuationStr = continuationBytes
            .map(b => b.toString(16).toUpperCase().padStart(2, "0"))
            .join(" ");
          
          // Indent continuation line with spaces
          listing += "     " + continuationStr.padEnd(12) + "            \n";
        }
      }
    }

    return listing;
  }
  
  // Parse comma-separated symbol list from an expression or statement tokens
  // Used for EXTRN and ENTRY directives
  private parseSymbolList(expr: Expression | null, targetArray: string[], stmt: Statement): void {
    // Collect all label tokens from the statement
    // The parser might not parse comma-separated symbols correctly, so we extract them from tokens
    let symbolText = "";
    
    // Check if we have a non-empty symbol from expression
    if (expr && expr.kind === "symbol" && expr.name.length > 0) {
      symbolText = expr.name;
    } else {
      // Extract symbols from tokens directly
      // Find all label tokens after the directive
      let foundDirective = false;
      for (const token of stmt.tokens) {
        if (token.kind === "directive") {
          foundDirective = true;
          continue;
        }
        if (foundDirective && (token.kind === "label" || token.kind === "string")) {
          symbolText += token.lexeme;
        } else if (foundDirective && token.kind === "comma") {
          symbolText += ",";
        }
      }
    }
    
    // Split by comma and add to target array (using Set for O(1) deduplication)
    if (symbolText) {
      const symbols = symbolText.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const existingSet = new Set(targetArray);
      for (const symbol of symbols) {
        // Remove quotes if present
        let cleanSymbol = symbol;
        if ((cleanSymbol.startsWith('"') && cleanSymbol.endsWith('"')) ||
            (cleanSymbol.startsWith("'") && cleanSymbol.endsWith("'"))) {
          cleanSymbol = cleanSymbol.slice(1, -1);
        }
        if (!existingSet.has(cleanSymbol)) {
          targetArray.push(cleanSymbol);
          existingSet.add(cleanSymbol);
        }
      }
    }
  }
  
  // Add a relocation entry to the RLD
  private addRelocation(address: number, size: number): void {
    this.relocationDictionary.push({ address, size });
  }
  
  // Check if an expression contains symbol references (needs relocation)
  private expressionContainsSymbol(expr: Expression): boolean {
    switch (expr.kind) {
      case "literal":
        return false;
      case "symbol":
        // Check if it's an external symbol or a defined symbol (not external symbols don't need relocation in RLD)
        // For now, return true if it's not a literal
        return true;
      case "binary":
        return this.expressionContainsSymbol(expr.left) || this.expressionContainsSymbol(expr.right);
    }
  }
  
  // Extract comma-separated numeric values from statement tokens
  // Used for data directives like DB, DW, DDB that can have multiple values
  private extractNumericValues(stmt: Statement): number[] {
    const values: number[] = [];
    
    // Find all tokens after the directive and collect numbers/expressions
    let foundDirective = false;
    let currentExprTokens: any[] = [];
    
    for (const token of stmt.tokens) {
      if (token.kind === "directive") {
        foundDirective = true;
        continue;
      }
      
      if (!foundDirective) continue;
      
      // When we hit a comma or EOL/comment/EOF, evaluate accumulated tokens as an expression
      if (token.kind === "comma" || token.kind === "eol" || token.kind === "comment" || token.kind === "eof") {
        if (currentExprTokens.length > 0) {
          // Parse the token lexeme to get the numeric value
          const firstToken = currentExprTokens[0];
          if (firstToken.kind === "number") {
            values.push(this.parseNumberFromLexeme(firstToken.lexeme));
          }
          currentExprTokens = [];
        }
      } else {
        currentExprTokens.push(token);
      }
    }
    
    // Don't forget the last expression if no trailing comma
    if (currentExprTokens.length > 0) {
      const firstToken = currentExprTokens[0];
      if (firstToken.kind === "number") {
        values.push(this.parseNumberFromLexeme(firstToken.lexeme));
      }
    }
    
    return values;
  }
  
  // Parse a number from its lexeme (handles $hex, @octal, %binary, decimal)
  private parseNumberFromLexeme(lexeme: string): number {
    if (lexeme.startsWith("$")) {
      return parseInt(lexeme.substring(1), 16);
    } else if (lexeme.startsWith("0x") || lexeme.startsWith("0X")) {
      return parseInt(lexeme.substring(2), 16);
    } else if (lexeme.startsWith("@")) {
      return parseInt(lexeme.substring(1), 8);
    } else if (lexeme.startsWith("%")) {
      return parseInt(lexeme.substring(1), 2);
    } else if (lexeme.startsWith("0b") || lexeme.startsWith("0B")) {
      return parseInt(lexeme.substring(2), 2);
    } else {
      return parseInt(lexeme, 10);
    }
  }
}
