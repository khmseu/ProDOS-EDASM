import { assemble } from "./dist/index.js";

console.log("Test: EXTRN with multiple symbols");
const test = `
    REL
    ORG $2000
    EXTRN PRINT,GETCHAR
START   JSR PRINT
    RTS
`;

try {
  const result = assemble(test);
  console.log("relocatable:", result.relocatable);
  console.log("externals:", result.externals);
  console.log("Success!");
} catch (error) {
  console.log("Error:", error.message);
  console.log("Stack:", error.stack);
}
