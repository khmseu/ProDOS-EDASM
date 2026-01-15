#!/usr/bin/env node
import { readFileSync } from 'fs';
import { assemble } from './dist/index.js';

const testSource = `
            MSB    OFF
            REP    50
            ORG    $D000

DoPass3     LDA    LstASym
            ORA    LstVSym
            BMI    ChkPrtCols
            RTS
`;

console.log('Testing small snippet from ASM1.S...');

try {
  const result = assemble(testSource, { 
    listing: true,
    basePath: '.'
  });
  
  console.log('✅ Assembly succeeded!');
  console.log(`Bytes generated: ${result.bytes.length}`);
  console.log(`Symbols: ${Object.keys(result.symbols).length}`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(err => console.log(`  Line ${err.line}: ${err.message}`));
  }
  
  console.log('\nListing:');
  console.log(result.listing);
  
} catch (err) {
  console.error('❌ Assembly failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
