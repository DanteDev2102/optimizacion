import { checkKKT } from './src/lib/utils/algorithms/Constraints.ts';

// 1. Definimos la función objetivo f(x) = x_1^2 + x_2^2
const f = (x) => x[0] * x[0] + x[1] * x[1];

// 2. Definimos nuestra restricción g(x) = 1 - x_1 - x_2 <= 0
const g1 = (x) => 1 - x[0] - x[1];
const ineqConstraints = [g1];
const eqConstraints = [];

// 3. Definimos el punto exacto que queremos evaluar (por ejemplo, el óptimo [0.5, 0.5])
const puntoAEvaluar = [0.5, 0.5];

// No le pasamos gradiente analítico (null) para que lo calcule numéricamente
const resultadoKKT = checkKKT(
  puntoAEvaluar,
  f,
  null,
  eqConstraints,
  ineqConstraints
);

console.log("=== REPORTE KKT PARA EL PUNTO [0.5, 0.5] ===");
console.log("Factible:", resultadoKKT.isFeasible);
console.log("LICQ Satisfecho:", resultadoKKT.licqSatisfied);
console.log("Estacionariedad Satisfecha:", resultadoKKT.stationaritySatisfied);
console.log("Multiplicadores (Lambda):", resultadoKKT.lagrangeMultipliers);
console.log("Violaciones:", resultadoKKT.violations);
