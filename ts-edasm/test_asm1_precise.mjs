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

console.log(`Testing narrow range around problematic area...`);

// Test in 10-line increments from 1300 to 1400
for (let numLines = 1300; numLines <= 1400; numLines += 10) {
  console.log(`\nTesting ${numLines} lines...`);
  const source = lines.slice(0, numLines).join('\n');
  
  let completed = false;
  let timedOut = false;
  const timeout = 2000; // 2 second timeout
  
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
      console.log(`  ✅ OK (${elapsed}ms)`);
    }
  } catch (err) {
    completed = true;
    clearTimeout(timer);
    if (!timedOut) {
      console.log(`  ❌ ERROR: ${err.message.substring(0, 80)}`);
    }
  }
  
  if (timedOut) {
    console.log(`\n=== PROBLEM FOUND ===`);
    console.log(`Hangs between line ${numLines - 10} and ${numLines}`);
    console.log(`\nShowing lines ${numLines - 10} to ${numLines}:`);
    for (let i = numLines - 10; i < Math.min(numLines, lines.length); i++) {
      console.log(`${(i + 1).toString().padStart(5, ' ')}: ${lines[i]}`);
    }
    break;
  }
}
