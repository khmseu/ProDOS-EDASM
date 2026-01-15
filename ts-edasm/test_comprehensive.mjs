import { assemble } from './dist/index.js';

console.log('='.repeat(60));
console.log('COMPREHENSIVE TEST: PC Reference + Indexed-Indirect');
console.log('='.repeat(60));
console.log('');

let passed = 0;
let failed = 0;

function test(name, source, expectations) {
  console.log(`Test: ${name}`);
  try {
    const result = assemble(source, { listing: false });
    
    if (expectations.bytes) {
      const actual = Array.from(result.bytes);
      const expected = expectations.bytes;
      const match = JSON.stringify(actual) === JSON.stringify(expected);
      if (match) {
        console.log('  ✅ Bytes match:', actual.map(b => '$' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        passed++;
      } else {
        console.log('  ❌ Bytes mismatch:');
        console.log('     Expected:', expected.map(b => '$' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        console.log('     Got:     ', actual.map(b => '$' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
        failed++;
      }
    }
    
    if (expectations.symbols) {
      for (const [sym, val] of Object.entries(expectations.symbols)) {
        if (result.symbols[sym] === val) {
          console.log(`  ✅ Symbol ${sym} = $${val.toString(16).toUpperCase()}`);
          passed++;
        } else {
          console.log(`  ❌ Symbol ${sym} mismatch: expected $${val.toString(16).toUpperCase()}, got $${result.symbols[sym]?.toString(16).toUpperCase() || 'undefined'}`);
          failed++;
        }
      }
    }
  } catch (error) {
    console.log('  ❌ Assembly failed:', error.message);
    failed++;
  }
  console.log('');
}

// Test 1: PC Reference
test('PC Reference: EQU *', `
        ORG $1000
START   NOP
HERE    EQU *
        LDA #$00
`, {
  symbols: { START: 0x1000, HERE: 0x1001 }
});

// Test 2: PC Arithmetic
test('PC Arithmetic: EQU *-1', `
        ORG $2000
        NOP
        INX
BACK    EQU *-1
`, {
  symbols: { BACK: 0x2001 }
});

// Test 3: Indexed Indirect (zp,X)
test('Indexed-Indirect: LDA (zp,X)', `
        ORG $3000
        LDA ($80,X)
`, {
  bytes: [0xA1, 0x80]
});

// Test 4: Indexed Indirect - STA
test('Indexed-Indirect: STA (zp,X)', `
        ORG $4000
        STA ($40,X)
`, {
  bytes: [0x81, 0x40]
});

// Test 5: Combined - PC ref + Indexed Indirect
test('Combined: PC Reference + Indexed-Indirect', `
        ORG $5000
START   EQU *
        LDA ($20,X)
        STA ($30,X)
END     EQU *
`, {
  bytes: [0xA1, 0x20, 0x81, 0x30],
  symbols: { START: 0x5000, END: 0x5004 }
});

// Test 6: Indirect-Indexed (zp),Y (should still work)
test('Indirect-Indexed: LDA (zp),Y', `
        ORG $6000
        LDA ($80),Y
`, {
  bytes: [0xB1, 0x80]
});

// Test 7: All arithmetic ops with indexed-indirect
test('All Arithmetic: ADC, SBC, AND, OR, EOR, CMP', `
        ORG $7000
        ADC ($10,X)
        SBC ($20,X)
        AND ($30,X)
        ORA ($40,X)
        EOR ($50,X)
        CMP ($60,X)
`, {
  bytes: [
    0x61, 0x10,  // ADC
    0xE1, 0x20,  // SBC
    0x21, 0x30,  // AND
    0x01, 0x40,  // ORA
    0x41, 0x50,  // EOR
    0xC1, 0x60   // CMP
  ]
});

console.log('='.repeat(60));
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('='.repeat(60));
