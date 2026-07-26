import { DFPOptimizer, LBFGSOptimizer, BFGSOptimizer } from './src/lib/utils/algorithms/QuasiNewton.ts';

// --- Función de Prueba: Rosenbrock ---
// f(x, y) = (1 - x)^2 + 100 * (y - x^2)^2
// Mínimo global en (1, 1) donde f(x, y) = 0
const rosenbrock = {
  objective: (x: number[]) => {
    return Math.pow(1 - x[0], 2) + 100 * Math.pow(x[1] - Math.pow(x[0], 2), 2);
  },
  gradient: (x: number[]) => {
    const dx = -2 * (1 - x[0]) - 400 * x[0] * (x[1] - Math.pow(x[0], 2));
    const dy = 200 * (x[1] - Math.pow(x[0], 2));
    return [dx, dy];
  }
};

const x0 = [-1.2, 1.0]; // Punto inicial clásico para Rosenbrock
const config = {
  maxIterations: 1000,
  tolerance: 1e-6,
  c1: 1e-4,
  c2: 0.9,
  m: 5 // Para L-BFGS
};

console.log("=== Probando DFP ===");
const dfp = new DFPOptimizer();
const resDFP = dfp.optimize(rosenbrock, x0, config as any);
console.log(`- Solución hallada: [${resDFP.solution[0].toFixed(5)}, ${resDFP.solution[1].toFixed(5)}]`);
console.log(`- Iteraciones: ${resDFP.iterations.length}`);

console.log("\n=== Probando L-BFGS ===");
const lbfgs = new LBFGSOptimizer();
const resLBFGS = lbfgs.optimize(rosenbrock, x0, config as any);
console.log(`- Solución hallada: [${resLBFGS.solution[0].toFixed(5)}, ${resLBFGS.solution[1].toFixed(5)}]`);
console.log(`- Iteraciones: ${resLBFGS.iterations.length}`);
