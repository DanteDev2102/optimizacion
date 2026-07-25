import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
const expr = ce.parse("4x_1");
const val = expr.subs({x_1: 1}).evaluate();
console.log("subs val:", val.valueOf());
