export function checkKKT(
  x: number[],
  gradF: number[],
  eqConst: Array<(x: number[]) => number> = [],
  ineqConst: Array<(x: number[]) => number> = [],
  tol = 1e-4
): { isFeasible: boolean, violations: string[] } {
  const violations: string[] = [];

  // Factibility check
  eqConst.forEach((h, i) => {
    const val = h(x);
    if (Math.abs(val) > tol) {
      violations.push(`Equality constraint h_${i+1} violated: ${val} != 0`);
    }
  });

  ineqConst.forEach((g, i) => {
    const val = g(x);
    if (val > tol) {
      violations.push(`Inequality constraint g_${i+1} violated: ${val} > 0`);
    }
  });

  return {
    isFeasible: violations.length === 0,
    violations
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
