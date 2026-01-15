import { Parser } from './dist/parser.js';

console.log('Testing pipe character and absolute addressing...\n');

const test1 = `
        LDA #0
; STA |Reg0,Y
        DB $99,$00,$00
        RTS
`;

console.log('Test 1: Comment with pipe character');
try {
  const parser = new Parser(test1);
  const result = parser.parse();
  console.log('✅ Parsed OK:', result.statements.length, 'statements');
} catch (error) {
  console.log('❌ Error:', error.message);
}
