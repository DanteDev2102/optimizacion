import { add, multiply, subtract } from "mathjs";

/**
 * Backtracking line search using Armijo and (optionally) Wolfe conditions.
 */
export function backtrackingLineSearch(
  f: (x: number[]) => number,
  gradF: (x: number[]) => number[],
  xk: number[],
  pk: number[],
  alphaInit: number = 1.0,
  c1: number = 1e-4,
  c2: number = 0.9,
  rho: number = 0.5,
  useWolfe: boolean = false
): { alpha: number; functionEvaluations: number } {
  let alpha = alphaInit;
  const fxk = f(xk);
  const gk = gradF(xk);
  
  // gk^T * pk
  let dotProd = 0;
  for (let i = 0; i < gk.length; i++) {
    dotProd += gk[i] * pk[i];
  }

  let funcEvals = 1; // Evaluated f(xk) usually outside, but count gk

  const maxIters = 50;
  for (let i = 0; i < maxIters; i++) {
    const step = multiply(pk, alpha);
    const xNext = add(xk, step) as number[];
    const fxNext = f(xNext);
    funcEvals++;

    // Armijo condition: f(xk + alpha*pk) <= f(xk) + c1*alpha * (gk^T pk)
    const armijo = fxNext <= fxk + c1 * alpha * dotProd;

    if (!armijo) {
      alpha *= rho;
      continue;
    }

    // Strong Wolfe condition (optional, important for Quasi-Newton)
    if (useWolfe) {
      const gNext = gradF(xNext);
      let dotProdNext = 0;
      for (let j = 0; j < gNext.length; j++) {
        dotProdNext += gNext[j] * pk[j];
      }
      
      const wolfe = Math.abs(dotProdNext) <= c2 * Math.abs(dotProd);
      
      if (!wolfe) {
        // Simple backtracking might not perfectly satisfy strong wolfe,
        // but for a basic implementation we just reduce alpha.
        // A more advanced line search would use interpolation/zoom.
        alpha *= rho;
        continue;
      }
    }

    break; // Both conditions satisfied
  }

  return { alpha, functionEvaluations: funcEvals };
}
