import { assemble } from './dist/index.js';
import { readFileSync } from 'fs';

const files = [
  'ASM/EXTERNALS.S',
  'EDITOR/EXTERNALS.S',
  'EI/EXTERNALS.S',
  'LINKER/EXTERNALS.S',
];

for (const file of files) {
  const fullPath = `/home/runner/work/ProDOS-EDASM/ProDOS-EDASM/ORG/test-compat/${file}`;
  const source = readFileSync(fullPath, 'utf-8');
  
  console.log(`\nTesting: ${file}`);
  console.log('  Lines:', source.split('\n').length);
  
  try {
    const result = assemble(source, { listing: false });
    console.log('  ✅ Success! Symbols:', Object.keys(result.symbols).length, 'Bytes:', result.bytes.length);
  } catch (error) {
    console.log('  ❌ Failed:', error.message?.substring(0, 80) || String(error).substring(0, 80));
  }
}
