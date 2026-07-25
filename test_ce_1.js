import { ComputeEngine } from '@cortex-js/compute-engine';
const ce = new ComputeEngine();
const e = ce.parse("1");
const val = e.evaluate();
console.log("val:", val);
console.log("numericValue:", val.numericValue);
console.log("valueOf:", val.valueOf());
console.log("parseFloat:", parseFloat(val.numericValue?.toString() || '0'));
