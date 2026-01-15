#!/usr/bin/env node
import { assemble } from './dist/index.js';

// Test just the problematic lines
const testSource = `
            ORG    $D000
CycTimes    DB     4               ;ADC abs
            DB     3               ;ADC zp
            DB     2               ;ADC #
            DB     4               ;ADC zp,X
            DB     4               ;ADC abs,X
            DB     4               ;ADC abs,Y
            DB     5               ;ADC (zp),y
            DB     6               ;ADC (zp,X)
            DB     5               ;ADC (zp)

            DB     04,03,02,04,04,04,05,06,05;AND
            DB     06,05,02,06,07  ;ASL
            DB     03,03,03        ;BCC,BCS,BEQ
            DB     04,03,02,04,04  ;BIT
            DB     03,03,03,03,07,03,03;BMI,BNE,BPL,BRA,BRK,BVC,BVS
            DB     02,02,02,02     ;CLC,CLD,CLI,CLV

            DB     04,03,02,04,04,04,05,06,05;CMP

            DB     04,03,02        ;CPX
            DB     04,03,02        ;CPY
`;

console.log('Testing isolated DB directives...');

try {
  const result = assemble(testSource, { listing: false });
  console.log(`✅ Success: ${result.bytes.length} bytes`);
  console.log(`Symbols: ${Object.keys(result.symbols).length}`);
  console.log(result.bytes.slice(0, 30));
} catch (err) {
  console.error(`❌ Error: ${err.message}`);
  console.error(err.stack);
}
