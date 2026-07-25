import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();
const latex = "4x_1 - 2x_2";

ce.assign('x_1', 1);
ce.assign('x_2', 2);
console.log("Eval 1:", ce.parse(latex).evaluate().valueOf());

ce.assign('x_1', 0);
ce.assign('x_2', 0);
console.log("Eval 2:", ce.parse(latex).evaluate().valueOf());

ce.assign('x_1', 10);
ce.assign('x_2', 5);
console.log("Eval 3:", ce.parse(latex).evaluate().valueOf());
