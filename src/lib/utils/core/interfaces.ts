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
  toleranceX?: number; // Tolerance for change in variables (epsilon 2)
  stepSize?: number;
  c1?: number; // Armijo parameter
  c2?: number; // Wolfe parameter
  contractionFactor?: number; // rho for Line Search
  lineSearchMethod?: "backtracking" | "zoom";
  lineSearchStrategy?: "backtracking" | "exact" | "constant" | string;
  populationSize?: number; // For GA
  generations?: number; // For GA
  bitsPerVariable?: number; // L_v
  crossoverRate?: number; // p_c
  mutationRate?: number; // p_m
  searchBounds?: { min: number[], max: number[] }; // For GA global exploration
  penaltyMethod?: "external" | "barrier"; // Constraint handling
  penaltyInitial?: number; // Initial mu/r value for penalty/barrier
  m?: number; // History size for L-BFGS (default 5)
  mHistory?: number;
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

export interface KKTAnalysis {
  isFeasible: boolean;
  stationarity: boolean;
  complementarity: boolean;
  lagrangeMultipliersEq: number[]; // Lambda values
  lagrangeMultipliersIneq: number[]; // Mu values
  violations: string[];
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
  kktAnalysis?: KKTAnalysis;
}

export interface IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult;
}
