import { Parser } from "./parser";
import { AssemblerOptions, AssemblyArtifact } from "./types";

// Two-pass assembler shell for EDASM compatibility.
export function assemble(source: string, options: AssemblerOptions = {}): AssemblyArtifact {
  const parser = new Parser(source);
  const { statements } = parser.parse();

  // TODO: implement pass one to collect symbols and pass two to emit bytes/RLD.
  const symbols: Record<string, number> = {};
  const listing = options.listing ? "" : undefined;
  const bytes = new Uint8Array();

  return { bytes, listing, symbols };
}
