import { assemble } from './dist/index.js';

console.log('Testing program counter (*) reference support...\n');

// Test 1: EQU *
console.log('Test 1: EQU * (assign label to current PC)');
const test1 = `
        ORG $1000
START   NOP
HERE    EQU *
        LDA #$00
`;
const result1 = assemble(test1, { listing: false });
console.log('  Assembled bytes:', Array.from(result1.bytes).map(b => '$' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('  Symbol START:', result1.symbols.START ? '$' + result1.symbols.START.toString(16).toUpperCase() : 'undefined');
console.log('  Symbol HERE:', result1.symbols.HERE ? '$' + result1.symbols.HERE.toString(16).toUpperCase() : 'undefined');
if (result1.symbols.HERE === 0x1001) {
  console.log('  ✅ PASS - HERE equals PC after NOP ($1001)\n');
} else {
  console.log('  ❌ FAIL - HERE should be $1001, got $' + result1.symbols.HERE.toString(16).toUpperCase() + '\n');
}

// Test 2: EQU *-1
console.log('Test 2: EQU *-1 (PC relative)');
const test2 = `
        ORG $2000
        NOP
        INX
BACK    EQU *-1
        RTS
`;
const result2 = assemble(test2, { listing: false });
console.log('  Assembled bytes:', Array.from(result2.bytes).map(b => '$' + b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
console.log('  Symbol BACK:', result2.symbols.BACK ? '$' + result2.symbols.BACK.toString(16).toUpperCase() : 'undefined');
if (result2.symbols.BACK === 0x2001) {
  console.log('  ✅ PASS - BACK equals PC-1 ($2001)\n');
} else {
  console.log('  ❌ FAIL - BACK should be $2001, got $' + result2.symbols.BACK.toString(16).toUpperCase() + '\n');
}

// Test 3: EQU *+10
console.log('Test 3: EQU *+10 (PC forward reference)');
const test3 = `
        ORG $3000
START   LDA #$00
FUTURE  EQU *+10
        RTS
`;
const result3 = assemble(test3, { listing: false });
console.log('  Symbol START:', result3.symbols.START ? '$' + result3.symbols.START.toString(16).toUpperCase() : 'undefined');
console.log('  Symbol FUTURE:', result3.symbols.FUTURE ? '$' + result3.symbols.FUTURE.toString(16).toUpperCase() : 'undefined');
if (result3.symbols.FUTURE === 0x3002 + 10) {
  console.log('  ✅ PASS - FUTURE equals PC+10 ($300C)\n');
} else {
  console.log('  ❌ FAIL - FUTURE should be $300C, got $' + result3.symbols.FUTURE.toString(16).toUpperCase() + '\n');
}

// Test 4: Multiple uses of *
console.log('Test 4: Multiple uses of * in same program');
const test4 = `
        ORG $4000
BEGIN   EQU *
        LDA #$00
MID     EQU *
        STA $2000
END     EQU *
`;
const result4 = assemble(test4, { listing: false });
console.log('  Symbol BEGIN:', result4.symbols.BEGIN ? '$' + result4.symbols.BEGIN.toString(16).toUpperCase() : 'undefined');
console.log('  Symbol MID:', result4.symbols.MID ? '$' + result4.symbols.MID.toString(16).toUpperCase() : 'undefined');
console.log('  Symbol END:', result4.symbols.END ? '$' + result4.symbols.END.toString(16).toUpperCase() : 'undefined');
if (result4.symbols.BEGIN === 0x4000 && result4.symbols.MID === 0x4002 && result4.symbols.END === 0x4005) {
  console.log('  ✅ PASS - All symbols correctly track PC\n');
} else {
  console.log('  ❌ FAIL - Symbols incorrect\n');
}

console.log('Program counter reference testing complete!');
