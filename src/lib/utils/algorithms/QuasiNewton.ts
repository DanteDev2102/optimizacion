import type { IOptimizer, IOptimizationProblem, OptimizationConfig, OptimizationResult, IterationResult } from "../core/interfaces";
import { backtrackingLineSearch } from "./LineSearch";
import { vectorNorm } from "../core/algebra";
import { multiply, add, subtract, identity, transpose, squeeze } from "mathjs";

export class BFGSOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, c1, c2 } = config;
    
    if (!problem.gradient) {
      throw new Error("BFGS requires an analytical gradient function.");
    }

    let xk = [...x0];
    const n = xk.length;
    
    // Initial inverse hessian approximation: H0 = I
    let Hk = identity(n) as number[][];
    
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);
      
      if (normG < tolerance) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      // pk = -Hk * gk
      let pkMat = multiply(multiply(Hk, -1), gk);
      let pk = Array.isArray(pkMat) && Array.isArray(pkMat[0]) 
             ? (squeeze(pkMat) as number[]) 
             : (pkMat as unknown as number[]);
      if (!Array.isArray(pk)) pk = [pk];

      // Line search (Wolfe conditions are highly recommended for BFGS)
      let alpha = 1.0; 
      const lineSearchResult = backtrackingLineSearch(
        problem.objective,
        problem.gradient,
        xk,
        pk,
        alpha,
        c1,
        c2,
        0.5,
        true // Strong Wolfe condition
      );
      
      alpha = lineSearchResult.alpha;
      funcEvals += lineSearchResult.functionEvaluations;

      const step = multiply(pk, alpha);
      const xkNext = add(xk, step) as number[];
      const gkNext = problem.gradient(xkNext);
      
      // Secant equation variables
      const sk = subtract(xkNext, xk) as number[];
      const yk = subtract(gkNext, gk) as number[];

      iterations.push({
        iteration: i,
        xk: [...xk],
        fxk,
        grad: gk,
        hessian: Hk, // Note: For BFGS we output the INVERSE hessian approx or Hk
        pk,
        stepSize: alpha,
        xkNext: [...xkNext],
        normGrad: normG
      });

      // BFGS Update formula
      // rho_k = 1 / (yk^T sk)
      let yk_sk = 0;
      for (let j=0; j<n; j++) yk_sk += yk[j] * sk[j];
      
      if (yk_sk > 1e-10) {
        const rho = 1.0 / yk_sk;
        const I = identity(n) as number[][];
        
        // Convert to 2D arrays for mathjs matrix mult
        const sk2D = sk.map(val => [val]); 
        const yk2D = yk.map(val => [val]);
        const skT = transpose(sk2D);
        const ykT = transpose(yk2D);
        
        // V_k = I - rho_k * yk * sk^T 
        // wait, the standard formula for H update:
        // H_{k+1} = (I - rho * sk * yk^T) Hk (I - rho * yk * sk^T) + rho * sk * sk^T
        
        const term1 = multiply(multiply(sk2D, ykT), rho); // rho * sk * yk^T
        const term2 = multiply(multiply(yk2D, skT), rho); // rho * yk * sk^T
        
        const left = subtract(I, term1) as number[][];
        const right = subtract(I, term2) as number[][];
        
        const H_left_right = multiply(multiply(left, Hk), right) as number[][];
        const last_term = multiply(multiply(sk2D, skT), rho) as number[][];
        
        Hk = add(H_left_right, last_term) as number[][];
      }

      xk = xkNext;
    }

    return {
      solution: xk,
      iterations,
      functionEvaluations: funcEvals,
      exitCondition: "MAX_ITERATIONS"
    };
  }
}
