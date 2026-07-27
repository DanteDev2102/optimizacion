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
    const { maxIterations, tolerance, toleranceX, stepSize, c1, c2 } = config;
    
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
        let pkMat = multiply(multiply(hInv, -1), gk) as any;
        if (Array.isArray(pkMat)) {
          pk = pkMat.flat(Infinity) as number[];
        } else if (pkMat && typeof pkMat === "object" && "valueOf" in pkMat) {
          const val = pkMat.valueOf();
          pk = (Array.isArray(val) ? val.flat(Infinity) : [val]) as number[];
        } else {
          pk = [Number(pkMat)];
        }
      } catch (e) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "ERROR",
          errorMessage: "Failed to invert Hessian even after modification."
        };
      }

      let alpha = stepSize || 1.0;
      const strategy = config.lineSearchStrategy || config.lineSearchMethod || "backtracking";

      if (strategy === "constant") {
        alpha = stepSize || 1.0;
      } else {
        const useWolfe = strategy === "zoom";
        const method = strategy === "zoom" ? "zoom" : "backtracking";
        const rho = config.contractionFactor ?? 0.5;

        const lineSearchResult = backtrackingLineSearch(
          problem.objective,
          problem.gradient,
          xk,
          pk,
          stepSize || 1.0,
          c1 ?? 1e-4,
          c2 ?? 0.9,
          rho,
          useWolfe,
          method
        );
        
        alpha = lineSearchResult.alpha;
        funcEvals += lineSearchResult.functionEvaluations;
      }

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

      if (toleranceX !== undefined && vectorNorm(step as number[]) < toleranceX) {
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
