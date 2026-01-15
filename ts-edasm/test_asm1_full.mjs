#!/usr/bin/env node
import { readFileSync } from 'fs';
import { assemble } from './dist/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const asmPath = join(__dirname, '..', 'ORG', 'test-compat', 'ASM', 'ASM1.S');
const fullSource = readFileSync(asmPath, 'utf-8');
const lines = fullSource.split('\n');

console.log(`Total lines in file: ${lines.length}\n`);

const testSizes = [1000, 1500, 2000, 2216];

for (const numLines of testSizes) {
  console.log(`Testing ${numLines} lines...`);
  const source = lines.slice(0, numLines).join('\n');
  
  const startTime = Date.now();
  const result = assemble(source, { 
    listing: false,
    basePath: join(__dirname, '..', 'ORG', 'test-compat', 'ASM')
  });
  const elapsed = Date.now() - startTime;
  
  console.log(`  ✅ Succeeded in ${elapsed}ms`);
  console.log(`  Bytes: ${result.bytes.length}, Symbols: ${Object.keys(result.symbols).length}, Errors: ${result.errors ? result.errors.length : 0}\n`);
}

console.log('All tests passed!');
