#!/usr/bin/env node
import { readFileSync } from 'fs';
import { assemble } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read ASM1.S and try to assemble just first N lines
const asmPath = join(__dirname, '..', 'ORG', 'test-compat', 'ASM', 'ASM1.S');
console.log(`Reading ${asmPath}...`);

try {
  const fullSource = readFileSync(asmPath, 'utf-8');
  const lines = fullSource.split('\n');
  console.log(`Total lines in file: ${lines.length}`);
  
  // Try progressively larger chunks
  const testSizes = [50, 100, 200, 500];
  
  for (const numLines of testSizes) {
    console.log(`\n=== Testing with ${numLines} lines ===`);
    const source = lines.slice(0, numLines).join('\n');
    
    const startTime = Date.now();
    const result = assemble(source, { 
      listing: false,
      basePath: join(__dirname, '..', 'ORG', 'test-compat', 'ASM')
    });
    const elapsed = Date.now() - startTime;
    
    console.log(`  ✅ Succeeded in ${elapsed}ms`);
    console.log(`  Bytes: ${result.bytes.length}, Symbols: ${Object.keys(result.symbols).length}, Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0 && result.errors.length < 20) {
      console.log(`  Sample errors:`);
      result.errors.slice(0, 5).forEach(err => {
        if (err.line && err.message) {
          console.log(`    Line ${err.line}: ${err.message}`);
        }
      });
    }
  }
  
} catch (err) {
  console.error('\n❌ Assembly failed:');
  console.error(err.message);
  process.exit(1);
}
