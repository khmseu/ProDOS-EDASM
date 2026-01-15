import { Parser } from './dist/parser.js';

console.log('Testing indexed indirect addressing...\n');

const test1 = `
SW16STat    LDA    Reg0
            STA    (Reg0,X)
            RTS
`;

console.log('Test 1: STA (Reg0,X)');
try {
  const parser = new Parser(test1);
  const result = parser.parse();
  console.log('✅ Parsed OK:', result.statements.length, 'statements');
} catch (error) {
  console.log('❌ Error:', error.message);
}
