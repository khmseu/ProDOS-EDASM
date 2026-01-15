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

console.log(`Total lines: ${lines.length}`);
console.log('Binary search for problematic line range...\n');

// Binary search to find where it starts hanging
let low = 500; // We know 500 works
let high = lines.length;
let lastWorking = 500;
const timeout = 5000; // 5 second timeout per test

while (low < high - 10) {
  const mid = Math.floor((low + high) / 2);
  console.log(`Testing ${mid} lines... (range: ${low}-${high})`);
  
  const source = lines.slice(0, mid).join('\n');
  
  let completed = false;
  let result = null;
  let error = null;
  
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT at ${mid} lines`);
      high = mid;
    }
  }, timeout);
  
  try {
    const startTime = Date.now();
    result = assemble(source, { listing: false, basePath: join(__dirname, '..', 'ORG', 'test-compat', 'ASM') });
    const elapsed = Date.now() - startTime;
    completed = true;
    clearTimeout(timer);
    
    console.log(`  ✅ OK (${elapsed}ms) - Bytes: ${result.bytes.length}, Symbols: ${Object.keys(result.symbols).length}`);
    lastWorking = mid;
    low = mid;
  } catch (err) {
    completed = true;
    clearTimeout(timer);
    console.log(`  ❌ ERROR: ${err.message.substring(0, 100)}`);
    high = mid;
  }
}

console.log(`\n=== RESULT ===`);
console.log(`Last working line count: ${lastWorking}`);
console.log(`Problem starts around line: ${low + 1} to ${high}`);
console.log(`\nShowing lines ${low} to ${low + 20}:`);
for (let i = low; i < Math.min(low + 20, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
