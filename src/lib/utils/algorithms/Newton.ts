import type { IOptimizer, IOptimizationProblem, OptimizationConfig, OptimizationResult, IterationResult } from "../core/interfaces";
import { backtrackingLineSearch } from "./LineSearch";
import { vectorNorm, getModifiedHessian } from "../core/algebra";
import { multiply, add, inv, squeeze } from "mathjs";

export class NewtonOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, stepSize, c1, c2 } = config;
    
    if (!problem.gradient || !problem.hessian) {
      throw new Error("Newton's method requires BOTH analytical gradient and hessian functions.");
    }

    let xk = [...x0];
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

      let hessian = problem.hessian(xk);
      
      // Robust Newton: Ensure Hessian is positive definite so pk is a descent direction
      hessian = getModifiedHessian(hessian);

      let pk: number[];
      try {
        const hInv = inv(hessian);
        const pkMat = multiply(multiply(hInv, -1), gk);
        pk = Array.isArray(pkMat) && Array.isArray(pkMat[0]) 
             ? (squeeze(pkMat) as number[]) 
             : (pkMat as unknown as number[]);
        if (!Array.isArray(pk)) pk = [pk];
      } catch (e) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "ERROR",
          errorMessage: "Failed to invert Hessian even after modification."
        };
      }

      let alpha = stepSize || 1.0; // Newton's natural step length is 1
      
      const lineSearchResult = backtrackingLineSearch(
        problem.objective,
        problem.gradient,
        xk,
        pk,
        alpha,
        c1,
        c2,
        0.5,
        false 
      );
      
      alpha = lineSearchResult.alpha;
      funcEvals += lineSearchResult.functionEvaluations;

      const step = multiply(pk, alpha);
      const xkNext = add(xk, step) as number[];

      iterations.push({
        iteration: i,
        xk: [...xk],
        fxk,
        grad: gk,
        hessian,
        pk,
        stepSize: alpha,
        xkNext: [...xkNext],
        normGrad: normG
      });

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
