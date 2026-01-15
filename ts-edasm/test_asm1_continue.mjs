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

// Test from 1200 onwards
const testSizes = [1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2216];
const timeout = 3000; // 3 second timeout

for (const numLines of testSizes) {
  console.log(`\nTesting ${numLines} lines...`);
  const source = lines.slice(0, numLines).join('\n');
  
  let completed = false;
  let timedOut = false;
  
  const timer = setTimeout(() => {
    if (!completed) {
      console.log(`  ⏱️  TIMEOUT`);
      timedOut = true;
    }
  }, timeout);
  
  try {
    const startTime = Date.now();
    const result = assemble(source, { listing: false, basePath: join(__dirname, '..', 'ORG', 'test-compat', 'ASM') });
    const elapsed = Date.now() - startTime;
    completed = true;
    clearTimeout(timer);
    
    if (!timedOut) {
      console.log(`  ✅ OK (${elapsed}ms) - Bytes: ${result.bytes.length}, Symbols: ${Object.keys(result.symbols).length}, Errors: ${result.errors ? result.errors.length : 0}`);
    }
  } catch (err) {
    completed = true;
    clearTimeout(timer);
    if (!timedOut) {
      console.log(`  ❌ ERROR: ${err.message.substring(0, 100)}`);
    }
  }
  
  if (timedOut) {
    console.log(`\nProblem starts between ${testSizes[testSizes.indexOf(numLines) - 1] || numLines - 100} and ${numLines} lines`);
    console.log(`\nShowing lines ${numLines - 50} to ${numLines}:`);
    for (let i = numLines - 50; i < Math.min(numLines, lines.length); i++) {
      console.log(`${(i + 1).toString().padStart(5, ' ')}: ${lines[i]}`);
    }
    break;
  }
}
