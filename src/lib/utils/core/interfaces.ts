export interface IOptimizationProblem {
  objective: (x: number[]) => number;
  gradient?: (x: number[]) => number[];
  hessian?: (x: number[]) => number[][];
  equalityConstraints?: Array<(x: number[]) => number>;
  inequalityConstraints?: Array<(x: number[]) => number>;
}

export interface OptimizationConfig {
  maxIterations: number;
  tolerance: number;
  stepSize?: number;
  c1?: number; // Armijo parameter
  c2?: number; // Wolfe parameter
  populationSize?: number; // For GA
  generations?: number; // For GA
}

export interface IterationResult {
  iteration: number;
  xk: number[];
  fxk: number;
  grad?: number[];
  hessian?: number[][];
  pk?: number[];
  stepSize?: number;
  xkNext?: number[];
  normGrad?: number;
  isFeasible?: boolean; // For constrained problems
}

export interface OptimizationResult {
  solution: number[];
  iterations: IterationResult[];
  functionEvaluations: number;
  exitCondition: "TOLERANCE_MET" | "MAX_ITERATIONS" | "DIVERGENCE" | "ERROR";
  errorMessage?: string;
  isFeasible?: boolean;
  kktViolations?: string[];
  licqSatisfied?: boolean;
  stationaritySatisfied?: boolean;
  lagrangeMultipliers?: number[];
}

export interface IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult;
}
