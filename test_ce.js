import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();
ce.assign('x_1', 1);
ce.assign('x_2', 2);

const latex = "4x_1 - 2x_2 + 6x_1^2 + 4x_1^3";
const expr = ce.parse(latex);

console.log("numericValue toString:", expr.evaluate().numericValue?.toString());
console.log("valueOf:", expr.evaluate().valueOf());
console.log("N().valueOf:", expr.N().valueOf());
console.log("numericValue primitive?", typeof expr.evaluate().numericValue);
