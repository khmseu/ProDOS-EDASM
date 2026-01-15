import { assemble } from './dist/index.js';

console.log('Testing simplified SWEET16 snippet...\n');

const test = `
        ORG $D000
NEWSW16 EQU *
        STA $58
        STX $59
        STY $5A
        PHP
        PLA
        STA $5B
        CLD
        PLA
        STA $00
        PLA
        STA $01
LD011   INC $00
        BNE LD017
        INC $01
LD017   LDY #0
SW16BK  EQU *-1
        LDA ($00),Y
        RTS
`;

try {
  const result = assemble(test, { listing: false });
  console.log('✅ Assembly succeeded!');
  console.log('   Symbols defined:', Object.keys(result.symbols).length);
  console.log('   Bytes generated:', result.bytes.length);
  console.log('   Symbol NEWSW16:', result.symbols.NEWSW16 ? '$' + result.symbols.NEWSW16.toString(16).toUpperCase() : 'undefined');
  console.log('   Symbol SW16BK:', result.symbols.SW16BK ? '$' + result.symbols.SW16BK.toString(16).toUpperCase() : 'undefined');
  console.log('   Symbol LD011:', result.symbols.LD011 ? '$' + result.symbols.LD011.toString(16).toUpperCase() : 'undefined');
  console.log('   Symbol LD017:', result.symbols.LD017 ? '$' + result.symbols.LD017.toString(16).toUpperCase() : 'undefined');
} catch (error) {
  console.log('❌ Assembly failed:');
  console.log('   Error:', error.message || error);
}
