import { assemble } from './dist/index.js';
import { readFileSync } from 'fs';

const testFiles = [
  '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/ASM/EQUATES.S',
  '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/EDITOR/EQUATES.S',
  '/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/BUGBYTER/EQUATES.S',
];

for (const file of testFiles) {
  const filename = file.split('/').pop();
  const source = readFileSync(file, 'utf-8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${filename}`);
  console.log(`${'='.repeat(60)}`);
  console.log('Source length:', source.length, 'characters');
  
  try {
    const result = assemble(source, { listing: false });
    console.log('✅ Assembly succeeded!');
    console.log('   Symbols defined:', Object.keys(result.symbols).length);
    console.log('   Bytes generated:', result.bytes.length);
  } catch (error) {
    console.log('❌ Assembly failed:');
    console.log('   Error:', error.message || error);
    if (error.line) console.log('   At line:', error.line);
  }
}
