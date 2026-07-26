import * as math from 'mathjs';

function numericGradient(f: (x: number[]) => number, x: number[], h = 1e-5): number[] {
  const grad = new Array(x.length).fill(0);
  for (let i = 0; i < x.length; i++) {
    const xPlus = [...x];
    xPlus[i] += h;
    const xMinus = [...x];
    xMinus[i] -= h;
    grad[i] = (f(xPlus) - f(xMinus)) / (2 * h);
  }
  return grad;
}

export function checkKKT(
  x: number[],
  f: (x: number[]) => number,
  gradF: number[] | null,
  eqConst: Array<(x: number[]) => number> = [],
  ineqConst: Array<(x: number[]) => number> = [],
  tol = 1e-4
) {
  const violations: string[] = [];
  const activeGradients: number[][] = [];
  const activeTypes: string[] = []; // "eq" or "ineq"

  // If analytic gradient is not provided (e.g. GA algorithm), compute it numerically
  const objectiveGradient = gradF || numericGradient(f, x);


  // 1. Factibility & Active Constraints
  eqConst.forEach((h, i) => {
    const val = h(x);
    if (Math.abs(val) > tol) {
      violations.push(`Equality constraint h_${i+1} violated: ${val.toFixed(4)} != 0`);
    } else {
      activeGradients.push(numericGradient(h, x));
      activeTypes.push("eq");
    }
  });

  ineqConst.forEach((g, i) => {
    const val = g(x);
    if (val > tol) {
      violations.push(`Inequality constraint g_${i+1} violated: ${val.toFixed(4)} > 0`);
    } else if (Math.abs(val) <= tol) {
      // It's active
      activeGradients.push(numericGradient(g, x));
      activeTypes.push("ineq");
    }
  });

  const isFeasible = violations.length === 0;
  
  let licqSatisfied = true;
  let stationaritySatisfied = false;
  let lagrangeMultipliers: number[] = [];

  // 2. LICQ
  if (activeGradients.length > 0) {
    if (activeGradients.length > x.length) {
      licqSatisfied = false; 
      violations.push("LICQ failed: Number of active constraints exceeds dimension (Linearly Dependent).");
    } else {
      // Check rank using Gram Matrix determinant: det(J * J^T)
      const J = activeGradients; 
      const J_T = math.transpose(J); 
      const Gram = math.multiply(J, J_T) as number[][]; 
      
      const determinant = Number(math.det(Gram));
      if (Math.abs(determinant) < 1e-6) {
        licqSatisfied = false;
        violations.push("LICQ failed: Gradients of active constraints are linearly dependent.");
      } else {
        licqSatisfied = true;
        // 3. Solve for Lagrange Multipliers: J * J^T * lambda = J * (-gradF)
        try {
          const negGradF = objectiveGradient.map(v => -v);
          const rightSide = math.multiply(J, negGradF) as number[];
          const invGram = math.inv(Gram);
          const lambda = math.multiply(invGram, rightSide) as number[];
          
          lagrangeMultipliers = lambda;
          stationaritySatisfied = true;

          // 4. Dual Feasibility (lambda >= 0 for inequalities)
          lambda.forEach((val, idx) => {
            if (activeTypes[idx] === "ineq" && val < -tol) {
              stationaritySatisfied = false;
              violations.push(`Dual Feasibility failed: Multiplier for inequality constraint must be >= 0, got ${val.toFixed(4)}`);
            }
          });
        } catch (e) {
          stationaritySatisfied = false;
          licqSatisfied = false;
          violations.push("Error computing Lagrange multipliers.");
        }
      }
    }
  } else {
    // Unconstrained minimum
    const gradNorm = Math.sqrt(objectiveGradient.reduce((sum, v) => sum + v*v, 0));
    if (gradNorm > 1e-2) {
      stationaritySatisfied = false;
      violations.push(`Stationarity failed: Gradient is not zero (norm = ${gradNorm.toFixed(4)}).`);
    } else {
      stationaritySatisfied = true;
    }
  }

  return {
    isFeasible,
    violations,
    licqSatisfied,
    stationaritySatisfied,
    lagrangeMultipliers
  };
}

/**
 * Creates a penalized objective function (External Penalty Method)
 * F(x) = f(x) + r * ( sum( h_i(x)^2 ) + sum( max(0, g_i(x))^2 ) )
 */
export function getPenalizedObjective(
  f: (x: number[]) => number,
  r: number,
  eqConst: Array<(x: number[]) => number> = [],
  ineqConst: Array<(x: number[]) => number> = []
): (x: number[]) => number {
  return (x: number[]) => {
    let penalty = 0;

    eqConst.forEach(h => {
      const val = h(x);
      penalty += val * val;
    });

    ineqConst.forEach(g => {
      const val = g(x);
      if (val > 0) {
        penalty += val * val;
      }
    });

    return f(x) + r * penalty;
  };
}
