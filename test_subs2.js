import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
const expr = ce.parse("4x_1");
const val1 = expr.subs({"x_1": 1}).evaluate();
const val2 = expr.subs({"x_{1}": 1}).evaluate();
console.log("subs x_1:", val1.valueOf());
console.log("subs x_{1}:", val2.valueOf());
