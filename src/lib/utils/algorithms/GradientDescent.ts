import type { IOptimizer, IOptimizationProblem, OptimizationConfig, OptimizationResult, IterationResult } from "../core/interfaces";
import { backtrackingLineSearch } from "./LineSearch";
import { vectorNorm } from "../core/algebra";
import { multiply, add } from "mathjs";

export class GradientDescentOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, stepSize, c1, c2 } = config;
    
    if (!problem.gradient) {
      throw new Error("Gradient descent requires an analytical gradient function.");
    }

    let xk = [...x0];
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);

      const pk = multiply(gk, -1) as number[];

      let alpha = stepSize || 1.0;
      
      // Only do line search if stepSize is not rigidly forced or if we want dynamic
      // Actually, gradient descent needs line search to be robust.
      const lineSearchResult = backtrackingLineSearch(
        problem.objective,
        problem.gradient,
        xk,
        pk,
        alpha,
        c1,
        c2,
        0.5,
        false // Usually armijo is enough for steepest descent
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
        pk,
        stepSize: alpha,
        xkNext: [...xkNext],
        normGrad: normG
      });

      if (normG < tolerance) {
        return {
          solution: xkNext,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
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
