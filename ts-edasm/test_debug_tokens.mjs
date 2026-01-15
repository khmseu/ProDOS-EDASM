import { Parser } from "./dist/parser.js";

const source = `
    EXTRN PRINT,GETCHAR
`;

const parser = new Parser(source);
const { statements } = parser.parse();

console.log("Parsed statements:", JSON.stringify(statements, null, 2));
