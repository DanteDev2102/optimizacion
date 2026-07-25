import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
const expr = ce.parse("4x_1");
const val = expr.evaluate();
console.log("val:", val.json);
console.log("valueOf:", val.valueOf());
console.log("Number(valueOf):", Number(val.valueOf()));
