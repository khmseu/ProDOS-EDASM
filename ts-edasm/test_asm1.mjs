#!/usr/bin/env node
import { readFileSync } from 'fs';
import { assemble } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read ASM1.S
const asmPath = join(__dirname, '..', 'ORG', 'test-compat', 'ASM', 'ASM1.S');
console.log(`Reading ${asmPath}...`);

try {
  const source = readFileSync(asmPath, 'utf-8');
  console.log(`Source length: ${source.length} characters`);
  console.log(`Lines: ${source.split('\n').length}`);
  
  console.log('\nAttempting to assemble...');
  const result = assemble(source, { 
    listing: false,
    basePath: join(__dirname, '..', 'ORG', 'test-compat', 'ASM')
  });
  
  console.log('\n✅ Assembly succeeded!');
  console.log(`Bytes generated: ${result.bytes.length}`);
  console.log(`Symbols defined: ${Object.keys(result.symbols).length}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors found:');
    result.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. Line ${err.line}: ${err.message}`);
    });
  }
  
  // Show first few symbols
  const symbols = Object.entries(result.symbols).slice(0, 10);
  console.log('\nFirst 10 symbols:');
  symbols.forEach(([name, value]) => {
    console.log(`  ${name} = $${value.toString(16).toUpperCase().padStart(4, '0')}`);
  });
  
} catch (err) {
  console.error('\n❌ Assembly failed:');
  console.error(err.message);
  if (err.stack) {
    console.error('\nStack trace:');
    console.error(err.stack);
  }
  process.exit(1);
}
