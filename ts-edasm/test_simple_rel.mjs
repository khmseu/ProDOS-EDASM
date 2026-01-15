import { assemble } from "./dist/index.js";

console.log("Test 1: Simple REL mode");
const test1 = `
    REL
    ORG $1000
START   LDA #$00
    RTS
`;

try {
  const result1 = assemble(test1);
  console.log("relocatable:", result1.relocatable);
  console.log("rld:", result1.rld);
  console.log("Success!");
} catch (error) {
  console.log("Error:", error.message);
}

console.log("\nTest 2: EXTRN with single symbol");
const test2 = `
    REL
    ORG $2000
    EXTRN PRINT
START   JSR PRINT
    RTS
`;

try {
  const result2 = assemble(test2);
  console.log("relocatable:", result2.relocatable);
  console.log("externals:", result2.externals);
  console.log("Success!");
} catch (error) {
  console.log("Error:", error.message);
}
