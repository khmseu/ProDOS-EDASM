import { Lexer } from './dist/lexer.js';

console.log('Testing comment lexing...\n');

const test = `; STA |Reg0,Y
        DB $99,$00,$00`;

console.log('Lexing:', test);
try {
  const lexer = new Lexer(test);
  const tokens = lexer.tokenize();
  console.log('✅ Tokens:', tokens.length);
  tokens.forEach((t, i) => {
    console.log(`  ${i}: ${t.kind} = "${t.lexeme}"`);
  });
} catch (error) {
  console.log('❌ Error:', error.message);
}
