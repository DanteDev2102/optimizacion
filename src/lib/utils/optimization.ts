import { ComputeEngine } from "@cortex-js/compute-engine";
import type { IOptimizationProblem, OptimizationConfig, OptimizationResult } from "./core/interfaces";
import { GradientDescentOptimizer } from "./algorithms/GradientDescent";
import { NewtonOptimizer } from "./algorithms/Newton";
import { BFGSOptimizer } from "./algorithms/QuasiNewton";
import { GeneticAlgorithmOptimizer } from "./algorithms/GeneticAlgorithm";
import { checkKKT } from "./algorithms/Constraints";

const ce = new ComputeEngine();

function getContext(xk: number[]): Record<string, number> {
  const context: Record<string, number> = {};
  xk.forEach((val, i) => {
    context[`x_${i + 1}`] = val;      
    context[`x_{${i + 1}}`] = val;    
    context[`x${i + 1}`] = val;       
  });
  return context;
}

export function parseObjective(latex: string): (x: number[]) => number {
  if (!latex) throw new Error("Objective function is required.");
  const expr = ce.parse(latex);
  return (x: number[]) => {
    const ctx = getContext(x);
    const val = expr.subs(ctx).evaluate();
    return Number(val.valueOf() ?? 0);
  };
}

export function parseVectorFunction(stringVec: string[][]): (x: number[]) => number[] {
  // stringVec is nx1 (or 1xn)
  const flat = stringVec.flat();
  const exprs = flat.map(s => ce.parse(s));
  return (x: number[]) => {
    const ctx = getContext(x);
    return exprs.map(expr => {
      const val = expr.subs(ctx).evaluate();
      return Number(val.valueOf() ?? 0);
    });
  };
}

export function parseMatrixFunction(stringMat: string[][]): (x: number[]) => number[][] {
  const exprs = stringMat.map(row => row.map(s => ce.parse(s)));
  return (x: number[]) => {
    const ctx = getContext(x);
    return exprs.map(row => row.map(expr => {
      const val = expr.subs(ctx).evaluate();
      return Number(val.valueOf() ?? 0);
    }));
  };
}

export function runOptimization(
  algorithm: "gradient" | "newton" | "bfgs" | "ga",
  objectiveLatex: string,
  gradientMat: string[][] | null,
  hessianMat: string[][] | null,
  x0Mat: string[][],
  config: OptimizationConfig,
  eqConstraints: string[] = [],
  ineqConstraints: string[] = []
): OptimizationResult {
  
  const problem: IOptimizationProblem = {
    objective: parseObjective(objectiveLatex),
  };

  // Parse Constraints
  if (eqConstraints.length > 0) {
    problem.equalityConstraints = eqConstraints.filter(c => c.trim() !== "").map(c => {
      try { return parseObjective(c); } catch { throw new Error(`Invalid Equality Constraint: ${c}`); }
    });
  }
  if (ineqConstraints.length > 0) {
    problem.inequalityConstraints = ineqConstraints.filter(c => c.trim() !== "").map(c => {
      try { return parseObjective(c); } catch { throw new Error(`Invalid Inequality Constraint: ${c}`); }
    });
  }

  const hasConstraints = (problem.equalityConstraints && problem.equalityConstraints.length > 0) || 
                         (problem.inequalityConstraints && problem.inequalityConstraints.length > 0);

  if (algorithm !== 'ga' && hasConstraints) {
    throw new Error("Constraints are only supported using the Penalty Method in the Genetic Algorithm (GA) right now. Analytical methods (Newton/BFGS/Gradient) require unconstrained formulations.");
  }

  if (algorithm === "newton" || algorithm === "bfgs" || algorithm === "gradient") {
    if (!gradientMat || gradientMat.length === 0 || gradientMat[0].length === 0 || gradientMat[0][0] === "") {
      throw new Error(`The ${algorithm} algorithm requires the Gradient vector to be provided.`);
    }
    problem.gradient = parseVectorFunction(gradientMat);
  }

  if (algorithm === "newton") {
    if (!hessianMat || hessianMat.length === 0 || hessianMat[0].length === 0 || hessianMat[0][0] === "") {
      throw new Error("Newton's method requires the Hessian matrix to be provided.");
    }
    problem.hessian = parseMatrixFunction(hessianMat);
  }

  // Parse Initial point x0
  // Handle if x0 is Nx1 or 1xN
  let x0Str = x0Mat.flat();
  let x0 = x0Str.map(s => {
    const expr = ce.parse(s);
    return Number(expr.evaluate().valueOf() ?? 0);
  });

  let optimizer;
  switch (algorithm) {
    case "gradient":
      optimizer = new GradientDescentOptimizer();
      break;
    case "newton":
      optimizer = new NewtonOptimizer();
      break;
    case "bfgs":
      optimizer = new BFGSOptimizer();
      break;
    case "ga":
      optimizer = new GeneticAlgorithmOptimizer();
      break;
    default:
      throw new Error("Unknown algorithm selected.");
  }

  const result = optimizer.optimize(problem, x0, config);

  // Check KKT Conditions at the solution
  if (problem.gradient && result.solution) {
    const kkt = checkKKT(
      result.solution,
      problem.gradient(result.solution),
      problem.equalityConstraints,
      problem.inequalityConstraints,
      config.tolerance
    );
    result.isFeasible = kkt.isFeasible;
    result.kktViolations = kkt.violations;
  }

  return result;
}
